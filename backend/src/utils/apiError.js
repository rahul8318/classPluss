/**
 * Custom API Error for structured operational errors
 */

class ApiError extends Error {
  constructor(statusCode, message, errors = null, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(msg = 'Bad Request', errors = null) {
    return new ApiError(400, msg, errors);
  }

  static unauthorized(msg = 'Unauthorized: Access token missing or invalid') {
    return new ApiError(401, msg);
  }

  static forbidden(msg = 'Forbidden: You do not have permission to perform this action') {
    return new ApiError(403, msg);
  }

  static notFound(msg = 'Resource not found') {
    return new ApiError(404, msg);
  }

  static conflict(msg = 'Resource conflict or duplicate entry') {
    return new ApiError(409, msg);
  }

  static unprocessable(msg = 'Validation error', errors = null) {
    return new ApiError(422, msg, errors);
  }

  static internal(msg = 'Internal server error') {
    return new ApiError(500, msg, null, false);
  }
}

module.exports = ApiError;
