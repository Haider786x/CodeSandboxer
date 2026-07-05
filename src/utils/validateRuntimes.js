const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function checkRuntime(cmd) {
  try {
    await execPromise(cmd);
    return true;
  } catch (error) {
    return false;
  }
}

async function validateRuntimes(logger) {
  if (process.env.EXECUTION_MODE !== 'local') return;

  const javaEnabled = process.env.ENABLE_JAVA !== 'false';
  const isWin = process.platform === 'win32';
  const pythonCmd = isWin ? 'python --version' : 'python3 --version';

  const checks = [
    checkRuntime('node --version'),
    javaEnabled ? checkRuntime('java -version') : Promise.resolve(null),
    checkRuntime(pythonCmd)
  ];

  const [node, java, python] = await Promise.all(checks);

  const missing = [];
  if (!node) missing.push('Node.js');
  if (javaEnabled && !java) missing.push('Java');
  if (!python) missing.push('Python');

  if (missing.length > 0) {
    logger.error(`Local execution mode failed: Missing required runtimes: ${missing.join(', ')}`);
    process.exit(1);
  }

  const runtimeList = ['Node.js', 'Python'];
  if (javaEnabled) runtimeList.push('Java');
  else logger.warn('Java runtime validation skipped (ENABLE_JAVA=false). Java execution is disabled.');

  logger.info(`Startup validation passed: ${runtimeList.join(', ')} are available.`);
}

module.exports = { validateRuntimes };
