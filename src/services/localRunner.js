const { spawn } = require("child_process");
const pino = require("pino");

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
    let stdoutData = "";
    let stderrData = "";
    let stdoutSize = 0;
    let stderrSize = 0;
    let errorType = null;
    let isFinished = false;
    console.log("COMMAND:", commandArgs);
    console.log("CWD:", localDir);
    // Build a curated environment for the child process.
    //
    // SECURITY: Do NOT pass process.env directly.  User-submitted code can
    // read the child's environment (e.g. `import os; print(os.environ)` in
    // Python, or `console.log(process.env)` in Node).  Forwarding process.env
    // would expose every application secret loaded at startup (DB URIs, API
    // keys, JWT secrets, etc.).
    //
    // We pass ONLY the OS-level variables that runtimes need to locate
    // executables and standard libraries — nothing application-specific.
    const isWin = process.platform === 'win32';
    const runtimeEnv = isWin
      ? {
          // Windows: required for subprocess resolution and temp file handling.
          PATH:       process.env.PATH,
          PATHEXT:    process.env.PATHEXT,    // executable extensions (.exe, .cmd …)
          SystemRoot: process.env.SystemRoot, // C:\Windows — required by javac/java
          COMSPEC:    process.env.COMSPEC,    // cmd.exe path
          TEMP:       process.env.TEMP,       // Java and others write to TEMP
          TMP:        process.env.TMP,
        }
      : {
          // Linux/macOS: PATH is sufficient for most runtimes.
          PATH:   process.env.PATH,
          HOME:   process.env.HOME,    // some runtimes read ~/ for config
          LANG:   process.env.LANG,    // locale — affects Python's default encoding
          TMPDIR: process.env.TMPDIR,  // Java tmp dir on macOS
        };

    // Run the command locally in the isolated temp dir
    const child = spawn(commandArgs[0], commandArgs.slice(1), {
      cwd: localDir,
      env: runtimeEnv,
    });

    // Timeout logic
    const timeoutId = setTimeout(() => {
      if (!isFinished) {
        errorType = "Time Limit Exceeded";
        child.kill("SIGKILL");
      }
    }, TIME_LIMIT_MS);

    function resolveResult() {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(timeoutId);
      const executionTimeMs = Date.now() - startTime;
      resolve({
        stdout: stdoutData,
        stderr: stderrData,
        errorType,
        executionTimeMs,
      });
    }

    child.stdout.on("data", (data) => {
      if (isFinished) return;
      stdoutSize += data.length;
      if (stdoutSize > MAX_OUTPUT_SIZE) {
        errorType = "Output Limit Exceeded";
        child.kill("SIGKILL");
        return;
      }
      stdoutData += data.toString();
    });

    child.stderr.on("data", (data) => {
      if (isFinished) return;
      stderrSize += data.length;
      if (stderrSize > MAX_OUTPUT_SIZE) {
        errorType = "Output Limit Exceeded";
        child.kill("SIGKILL");
        return;
      }
      stderrData += data.toString();
    });

    child.on("close", (code, signal) => {
      if (!isFinished) {
        if (signal === "SIGKILL" && !errorType) {
          errorType = "Runtime Error";
        } else if (code !== 0 && !errorType) {
          errorType = "Runtime Error";
        }
        resolveResult();
      }
    });

    child.on("error", (err) => {
      logger.error(`Failed to spawn local process for ${uuid}`, err);
      if (!isFinished) {
        errorType = "Internal Error";
        resolveResult();
      }
    });
  });
}

module.exports = { runLocal };
