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

  const isWin = process.platform === 'win32';
  const pythonCmd = isWin ? 'python --version' : 'python3 --version';

  const [node, java, python] = await Promise.all([
    checkRuntime('node --version'),
    checkRuntime('java -version'),
    checkRuntime(pythonCmd)
  ]);

  const missing = [];
  if (!node) missing.push('Node.js');
  if (!java) missing.push('Java');
  if (!python) missing.push('Python');

  if (missing.length > 0) {
    logger.error(`Local execution mode failed: Missing required runtimes: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  logger.info('Startup validation passed: Node.js, Java, and Python are available.');
}

module.exports = { validateRuntimes };
