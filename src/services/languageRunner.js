const { getRunner } = require('./runnerFactory');

const languageConfigs = {
  python: {
    image: 'codebattle-python',
    filename: 'script.py',
    runCommand: [process.platform === 'win32' ? 'python' : 'python3', 'script.py']
  },
  javascript: {
    image: 'codebattle-node',
    filename: 'script.js',
    runCommand: ['node', 'script.js']
  },
  java: {
    image: 'codebattle-java',
    filename: 'Main.java',
    compileCommand: ['javac', 'Main.java'],
    runCommand: ['java', 'Main']
  }
};

/**
 * Runs the source code for the given language.
 * @param {string} language 
 * @param {string} uuid 
 * @param {string} hostDir 
 * @param {string} localDir
 * @returns {Promise<{stdout: string, stderr: string, errorType: string | null, executionTimeMs: number}>}
 */
async function runLanguage(language, uuid, hostDir, localDir) {
  const config = languageConfigs[language];
  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const runCode = getRunner();

  // Java requires a compilation step
  if (language === 'java') {
    const compileResult = await runCode(uuid + '-compile', hostDir, localDir, config.image, config.compileCommand);
    if (compileResult.errorType || compileResult.stderr.length > 0) {
      if (compileResult.errorType || compileResult.stderr) {
        return {
          stdout: compileResult.stdout,
          stderr: compileResult.stderr,
          errorType: 'Compilation Error',
          executionTimeMs: compileResult.executionTimeMs
        };
      }
    }
  }

  // Execute the code
  return runCode(uuid, hostDir, localDir, config.image, config.runCommand);
}

function getFilename(language) {
  return languageConfigs[language]?.filename;
}

module.exports = { runLanguage, getFilename };
