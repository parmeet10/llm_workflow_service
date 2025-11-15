import { logger } from '../utils/logger.js';

// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
  logger.error('Error:', err.message);

  // Default to 500 if no status code
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    status: statusCode
  });
};

// 404 handler for undefined routes
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
};

export default errorHandler;
