const express = require('express');
const cors = require('cors');
const pino = require('pino');
const dotenv = require('dotenv');
const { exec } = require('child_process');

dotenv.config();

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const executeRoute = require('./routes/execute');
app.use('/execute', executeRoute);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/ready', (req, res) => {
  if (process.env.EXECUTION_MODE === 'local') {
    return res.json({ status: 'ok', mode: 'local' });
  }
  // Check if Docker daemon is reachable
  exec('docker info', (error) => {
    if (error) {
      logger.error('Docker daemon is not reachable', error);
      return res.status(503).json({ status: 'error', message: 'Docker daemon not reachable' });
    }
    res.json({ status: 'ok', mode: 'docker' });
  });
});

app.get('/version', (req, res) => {
  res.json({
    service: 'codebattle-judge',
    version: '1.0.0'
  });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`Judge service listening on port ${PORT}`);
  });
}

module.exports = { app, logger };
