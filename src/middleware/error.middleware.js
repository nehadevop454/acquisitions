import logger from '#config/logger.js';

export const notFound = (req, res, next) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const status = err.status ?? err.statusCode ?? 500;
  logger.error(`${status} - ${err.message}`, { stack: err.stack, path: req.originalUrl });
  res.status(status).json({
    error: status < 500 ? err.message : 'Internal server error',
  });
};
