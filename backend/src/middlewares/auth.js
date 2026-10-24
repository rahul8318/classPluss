const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('../utils/apiError');
const User = require('../models/User');

/**
 * Authenticate JWT middleware
 * Compatible with shared token format (sub = userId, email, role, name)
 */
const authenticate = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return next(ApiError.unauthorized('Authentication token is required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Ensure user still exists and is active
      const user = await User.findById(decoded.sub || decoded.id).select('+isActive');
      if (!user) {
        return next(ApiError.unauthorized('User associated with this token no longer exists'));
      }
      if (!user.isActive) {
        return next(ApiError.forbidden('User account has been deactivated'));
      }

      req.user = {
        id: user._id.toString(),
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      next();
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Authentication token has expired'));
      }
      return next(ApiError.unauthorized('Invalid authentication token'));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 * @param  {...string} roles - e.g. 'teacher', 'admin'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('User not authenticated'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Role '${req.user.role}' is not authorized to perform this action. Required: [${roles.join(', ')}]`
        )
      );
    }
    next();
  };
};

module.exports = { authenticate, authorize };
