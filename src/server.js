const express = require('express');
const cors = require('cors');
const pino = require('pino');
const dotenv = require('dotenv');
const { exec } = require('child_process');

dotenv.config();

// Use pino-pretty only outside of production for human-readable logs.
// In production, emit raw JSON for log aggregators (faster, parseable).
const isProduction = process.env.NODE_ENV === 'production';

const logger = isProduction
  ? pino()
  : pino({
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true
        }
      }
    });

const app = express();

// CORS: configurable via CORS_ORIGIN env var.
// Supports a single origin or a comma-separated list.
// Defaults to '*' if CORS_ORIGIN is not set — preserves original open behaviour.
const corsOriginEnv = process.env.CORS_ORIGIN;
let corsOrigin = '*';
if (corsOriginEnv) {
  const parts = corsOriginEnv.split(',').map((s) => s.trim()).filter(Boolean);
  corsOrigin = parts.length === 1 ? parts[0] : parts;
}
app.use(cors({ origin: corsOrigin }));

app.use(express.json({ limit: '5mb' }));

const executeRoute = require('./routes/execute');
app.use('/execute', executeRoute);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/ready', (req, res) => {
  if (process.env.EXECUTION_MODE === 'local') {
    return res.json({ 
      status: 'ok', 
      mode: 'local',
      runtimes: {
        node: true,
        java: true,
        python: true
      }
    });
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

const { validateRuntimes } = require('./utils/validateRuntimes');

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  validateRuntimes(logger).then(() => {
    app.listen(PORT, () => {
      logger.info(`Judge service listening on port ${PORT}`);
    });
  });
}

module.exports = { app, logger };
