const express = require('express');
const { executeCode } = require('../services/executor');

const router = express.Router();

router.post('/', async (req, res) => {
  const { language, sourceCode } = req.body;

  if (!language || !sourceCode) {
    return res.status(400).json({
      status: 'Internal Error',
      stdout: '',
      stderr: 'Missing language or sourceCode',
      executionTimeMs: 0
    });
  }

  // Java can be disabled via ENABLE_JAVA=false for deployments that lack a JDK
  // (e.g. Render Free tier). All other languages are unaffected.
  if (language === 'java' && process.env.ENABLE_JAVA === 'false') {
    return res.status(400).json({
      status: 'Unsupported Language',
      stdout: '',
      stderr: 'Java execution is disabled on this deployment.',
      executionTimeMs: 0
    });
  }

  const supportedLanguages = ['python', 'javascript', 'java'];
  if (!supportedLanguages.includes(language)) {
    return res.status(400).json({
      status: 'Internal Error',
      stdout: '',
      stderr: `Language ${language} is not supported. Supported languages: ${supportedLanguages.join(', ')}`,
      executionTimeMs: 0
    });
  }

  try {
    const result = await executeCode(language, sourceCode);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({
      status: 'Internal Error',
      stdout: '',
      stderr: 'An unexpected error occurred during execution',
      executionTimeMs: 0
    });
  }
});

module.exports = router;
