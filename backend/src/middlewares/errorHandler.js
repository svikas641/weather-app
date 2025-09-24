import { logger } from '../logger.js';

export function notFoundHandler(_req, res, _next) {
  res.status(404).json({
    error: 'Not Found'
  });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const payload = {
    error: err.message || 'Internal Server Error'
  };
  if (err.meta) {
    payload.meta = err.meta;
  }
  if (status >= 500) {
    logger.error({ err }, 'Request failed with server error');
  } else {
    logger.warn({ err }, 'Request failed with client error');
  }
  res.status(status).json(payload);
}


