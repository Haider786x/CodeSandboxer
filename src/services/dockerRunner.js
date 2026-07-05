const { spawn, exec } = require('child_process');
const pino = require('pino');

const logger = pino();

const MAX_OUTPUT_SIZE = 1024 * 1024; // 1 MB
const TIME_LIMIT_MS = 5000;

/**
 * Runs a Docker container using spawn and captures output.
 * @param {string} uuid - Unique identifier for the execution.
 * @param {string} hostDir - The host directory to mount.
 * @param {string} localDir - Unused in Docker runner (hostDir is used for volume mount).
 * @param {string} image - The Docker image to use.
 * @param {string[]} commandArgs - The command to run inside the container.
 * @returns {Promise<{stdout: string, stderr: string, errorType: string | null, executionTimeMs: number}>}
 */
async function runDocker(uuid, hostDir, localDir, image, commandArgs) {
  const containerName = `judge-${uuid}`;

  const dockerArgs = [
    'run',
    '--rm',
    `--name=${containerName}`,
    '--network=none',
    '--memory=256m',
    '--cpus=1',
    '--pids-limit=64',
    '--read-only',
    '--cap-drop=ALL',
    '--security-opt=no-new-privileges',
    '-v', `${hostDir}:/workspace`,
    image,
    ...commandArgs
  ];

  const startTime = Date.now();

  return new Promise((resolve) => {
    let stdoutData = '';
    let stderrData = '';
    let stdoutSize = 0;
    let stderrSize = 0;
    let errorType = null; // 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Output Limit Exceeded'
    let isFinished = false;

    const child = spawn('docker', dockerArgs);

    /**
     * Resolves the promise exactly once.
     * All code paths (timeout, close, error) call this function.
     * The isFinished flag ensures the promise is never resolved more than once.
     */
    function resolveResult() {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(timeoutId);
      const executionTimeMs = Date.now() - startTime;
      resolve({
        stdout: stdoutData,
        stderr: stderrData,
        errorType,
        executionTimeMs
      });
    }

    // Timeout logic: kill the container then resolve once the kill succeeds.
    const timeoutId = setTimeout(() => {
      if (!isFinished) {
        errorType = 'Time Limit Exceeded';
        // Force kill the container; resolve inside the callback so that
        // executionTimeMs reflects the full wall-clock time.
        exec(`docker kill ${containerName}`, () => {
          resolveResult();
        });
      }
    }, TIME_LIMIT_MS);

    child.stdout.on('data', (data) => {
      if (isFinished) return;
      stdoutSize += data.length;
      if (stdoutSize > MAX_OUTPUT_SIZE) {
        errorType = 'Output Limit Exceeded';
        exec(`docker kill ${containerName}`);
        return;
      }
      stdoutData += data.toString();
    });

    child.stderr.on('data', (data) => {
      if (isFinished) return;
      stderrSize += data.length;
      if (stderrSize > MAX_OUTPUT_SIZE) {
        errorType = 'Output Limit Exceeded';
        exec(`docker kill ${containerName}`);
        return;
      }
      stderrData += data.toString();
    });

    child.on('close', (code) => {
      if (!isFinished) {
        // If code is 137, it might be OOM killer or our docker kill
        if (code === 137 && !errorType) {
          // If we didn't set errorType, it was likely memory limit
          errorType = 'Memory Limit Exceeded';
        } else if (code !== 0 && !errorType) {
          errorType = 'Runtime Error';
        }
        resolveResult();
      }
    });

    child.on('error', (err) => {
      logger.error(`Failed to spawn docker process for ${uuid}`, err);
      if (!isFinished) {
        errorType = 'Internal Error';
        resolveResult();
      }
    });
  });
}

module.exports = { runDocker };
