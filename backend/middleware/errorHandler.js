/**
 * Error Handler Middleware
 * Centralized error handling for Express application
 */

const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
  }

  // Fabric-specific errors
  if (err.message && err.message.includes('ENDORSEMENT_POLICY_FAILURE')) {
    statusCode = 400;
    message = 'Endorsement policy not satisfied';
  } else if (err.message && err.message.includes('MVCC_READ_CONFLICT')) {
    statusCode = 409;
    message = 'Concurrent modification detected, please retry';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
