const { spawn } = require('child_process');
const pino = require('pino');

const logger = pino();

const MAX_OUTPUT_SIZE = 1024 * 1024; // 1 MB
const TIME_LIMIT_MS = 5000;

/**
 * Runs code locally using spawn and captures output.
 * @param {string} uuid - Unique identifier for the execution.
 * @param {string} hostDir - Unused in local runner.
 * @param {string} localDir - The local directory to use as cwd.
 * @param {string} image - Unused in local runner.
 * @param {string[]} commandArgs - The command to run.
 * @returns {Promise<{stdout: string, stderr: string, errorType: string | null, executionTimeMs: number}>}
 */
async function runLocal(uuid, hostDir, localDir, image, commandArgs) {
  const startTime = Date.now();

  return new Promise((resolve) => {
    let stdoutData = '';
    let stderrData = '';
    let stdoutSize = 0;
    let stderrSize = 0;
    let errorType = null;
    let isFinished = false;

    // Run the command locally in the isolated temp dir
    const child = spawn(commandArgs[0], commandArgs.slice(1), {
      cwd: localDir,
      env: {} // No environment variables exposed to the user code
    });

    // Timeout logic
    const timeoutId = setTimeout(() => {
      if (!isFinished) {
        isFinished = true;
        errorType = 'Time Limit Exceeded';
        child.kill('SIGKILL');
        resolveResult();
      }
    }, TIME_LIMIT_MS);

    function resolveResult() {
      if (isFinished && errorType !== 'Time Limit Exceeded' && errorType !== 'Output Limit Exceeded') return;
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

    child.stdout.on('data', (data) => {
      if (isFinished) return;
      stdoutSize += data.length;
      if (stdoutSize > MAX_OUTPUT_SIZE) {
        errorType = 'Output Limit Exceeded';
        child.kill('SIGKILL');
        return;
      }
      stdoutData += data.toString();
    });

    child.stderr.on('data', (data) => {
      if (isFinished) return;
      stderrSize += data.length;
      if (stderrSize > MAX_OUTPUT_SIZE) {
        errorType = 'Output Limit Exceeded';
        child.kill('SIGKILL');
        return;
      }
      stderrData += data.toString();
    });

    child.on('close', (code, signal) => {
      if (!isFinished) {
        if (signal === 'SIGKILL' && !errorType) {
          errorType = 'Runtime Error';
        } else if (code !== 0 && !errorType) {
          errorType = 'Runtime Error';
        }
        resolveResult();
      }
    });

    child.on('error', (err) => {
      logger.error(`Failed to spawn local process for ${uuid}`, err);
      if (!isFinished) {
        errorType = 'Internal Error';
        resolveResult();
      }
    });
  });
}

module.exports = { runLocal };
