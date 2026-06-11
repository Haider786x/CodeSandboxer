const { runDocker } = require('./dockerRunner');
const { runLocal } = require('./localRunner');

function getRunner() {
  const mode = process.env.EXECUTION_MODE || 'docker';
  if (mode === 'local') {
    return runLocal;
  }
  return runDocker;
}

module.exports = { getRunner };
