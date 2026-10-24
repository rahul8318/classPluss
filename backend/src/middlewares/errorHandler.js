const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const config = require('../config/env');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid resource identifier for field: ${err.path}`);
  }

  // Handle Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = ApiError.conflict(`Duplicate value entered for ${field}. Please use another value.`);
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const formattedErrors = Object.values(err.errors || {}).map(e => ({
      field: e.path,
      message: e.message,
    }));
    error = ApiError.unprocessable('Validation Error', formattedErrors);
  }

  // Handle Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = ApiError.badRequest(`File too large. Maximum allowed size is ${config.upload.maxFileSizeMb}MB.`);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} - ${message}`, error);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: error.errors || null,
    stack: config.nodeEnv === 'development' && statusCode >= 500 ? error.stack : undefined,
  });
};

module.exports = errorHandler;
