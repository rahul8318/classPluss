/**
 * Standard API Response Formatter
 * Ensures predictable, consistent JSON responses across all ClassPulse endpoints
 */

class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200, meta = undefined) {
    const payload = {
      success: true,
      statusCode,
      message,
      data,
    };
    if (meta !== undefined) {
      payload.meta = meta;
    }
    return res.status(statusCode).json(payload);
  }

  static created(res, data = null, message = 'Resource created successfully', meta = undefined) {
    return ApiResponse.success(res, data, message, 201, meta);
  }

  static paginated(res, data, page, limit, total, message = 'Data retrieved successfully') {
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message,
      data,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total),
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  }

  static error(res, message = 'An error occurred', statusCode = 500, errors = null) {
    const payload = {
      success: false,
      statusCode,
      message,
    };
    if (errors) {
      payload.errors = errors;
    }
    return res.status(statusCode).json(payload);
  }
}

module.exports = ApiResponse;
