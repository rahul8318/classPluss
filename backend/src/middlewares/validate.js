const { ZodError } = require('zod');
const ApiError = require('../utils/apiError');

/**
 * Zod validation middleware
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} source
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return next(ApiError.unprocessable('Validation failed', formattedErrors));
      }
      next(error);
    }
  };
};

module.exports = validate;
