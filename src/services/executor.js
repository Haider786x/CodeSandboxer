const { createTempDir, writeSourceCode, cleanupTempDir } = require('../utils/tempFiles');
const { runLanguage, getFilename } = require('./languageRunner');
const pino = require('pino');

const logger = pino();

async function executeCode(language, sourceCode) {
  const filename = getFilename(language);
  if (!filename) {
    return {
      status: 'Internal Error',
      stdout: '',
      stderr: `Unsupported language: ${language}`,
      executionTimeMs: 0
    };
  }

  let tempDirInfo = null;
  try {
    tempDirInfo = await createTempDir();
    await writeSourceCode(tempDirInfo.localDir, filename, sourceCode);

    const result = await runLanguage(language, tempDirInfo.uuid, tempDirInfo.hostDir, tempDirInfo.localDir);

    let status = 'Accepted';
    if (result.errorType) {
      status = result.errorType; // 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Runtime Error', 'Compilation Error', 'Output Limit Exceeded', 'Internal Error'
    } else if (result.stderr && result.stderr.length > 0) {
      // If there's stderr output but no hard failure, typically treated as runtime error in judges
      // unless the language specifically writes warnings to stderr.
      // For simplicity, we can assume Accepted if no non-zero exit code was hit, but let's be strict if needed.
      // Wait, we set errorType = 'Runtime Error' if exit code !== 0.
      // So if stderr has content but exit code was 0, it might just be the user printing to stderr. We can keep it Accepted.
      status = 'Accepted';
    }

    // Default memoryUsedKb to 0 or estimate if needed. We don't have cgroups memory tracking here.
    return {
      status: status,
      stdout: result.stdout,
      stderr: result.stderr,
      executionTimeMs: result.executionTimeMs,
      memoryUsedKb: 0 // Placeholder as requested
    };

  } catch (err) {
    logger.error('Error during execution', err);
    return {
      status: 'Internal Error',
      stdout: '',
      stderr: err.message,
      executionTimeMs: 0
    };
  } finally {
    if (tempDirInfo) {
      await cleanupTempDir(tempDirInfo.localDir);
    }
  }
}

module.exports = { executeCode };
