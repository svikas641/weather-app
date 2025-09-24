import 'dotenv/config.js';
import { createServer } from 'http';
import app from './server.js';
import { logger } from './logger.js';
import { redisClient } from './cache.js';

const port = Number(process.env.PORT) || 4000;

const server = createServer(app);

server.listen(port, () => {
  logger.info({ port }, 'Server listening');
});

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info({ signal }, 'Received shutdown signal');
  server.close(async (err) => {
    if (err) {
      logger.error({ err }, 'Error closing server');
      process.exit(1);
    }

    try {
      if (redisClient) {
        await redisClient.quit();
        logger.info('Redis connection closed');
      }
    } catch (e) {
      logger.warn({ err: e }, 'Failed closing Redis');
    }

    try {
      // pino v8 flush is automatic on exit; ensure logs are flushed
      logger.info('Shutdown complete');
    } catch (e) {
      // ignore
    } finally {
      process.exit(0);
    }
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));


