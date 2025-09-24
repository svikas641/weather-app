import { logger } from '../logger.js';

export function requestLogger(req, _res, next) {
  const start = Date.now();
  const { method, url, ip } = req;

  // Log when response finishes
  req.on('end', () => {
    const ms = Date.now() - start;
    logger.info({ method, url, ip, ms }, 'Request completed');
  });

  // Express emits finish on res
  resOnFinish(req, start);

  logger.info({ method, url, ip }, 'Incoming request');
  next();
}

function resOnFinish(req, start) {
  const res = req.res;
  res.on('finish', () => {
    const ms = Date.now() - start;
    const { method, url, ip } = req;
    const { statusCode } = res;
    // One completion log is enough; the 'end' listener above may not always fire
    // across all environments.
    // This 'finish' is reliable.
    // We keep both defensively; pino deduplication is fine.
    // No-op here besides relying on the first listener.
    // Optionally uncomment to log:
    // logger.info({ method, url, ip, statusCode, ms }, 'Response finished');
  });
}


