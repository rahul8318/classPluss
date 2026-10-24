const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const AuditService = require('../services/auditService');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, bio } = req.body;

    if (!name || !email || !password) {
      return next(ApiError.badRequest('Name, email, and password are required'));
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(ApiError.conflict('An account with this email address already exists'));
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'student',
      bio: bio || '',
    });

    const token = user.generateToken();

    await AuditService.log({
      userId: user._id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user._id,
      details: { role: user.role, email: user.email },
      ipAddress: req.ip,
    });

    return ApiResponse.created(
      res,
      {
        user: user.toJSON(),
        token,
      },
      'User registered successfully'
    );
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(ApiError.badRequest('Email and password are required'));
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +isActive');
    if (!user) {
      return next(ApiError.unauthorized('Invalid email or password'));
    }

    if (!user.isActive) {
      return next(ApiError.forbidden('Your account has been deactivated'));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(ApiError.unauthorized('Invalid email or password'));
    }

    user.lastLogin = new Date();
    await user.save();

    const token = user.generateToken();

    await AuditService.log({
      userId: user._id,
      action: 'USER_LOGGED_IN',
      entityType: 'User',
      entityId: user._id,
      details: { email: user.email },
      ipAddress: req.ip,
    });

    return ApiResponse.success(
      res,
      {
        user: user.toJSON(),
        token,
      },
      'Logged in successfully'
    );
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(ApiError.notFound('User not found'));
    }
    return ApiResponse.success(res, { user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, avatar } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(ApiError.notFound('User not found'));
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    return ApiResponse.success(res, { user: user.toJSON() }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};
