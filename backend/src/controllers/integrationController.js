const jwt = require('jsonwebtoken');
const config = require('../config/env');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const AttendanceRecord = require('../models/AttendanceRecord');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const AuditService = require('../services/auditService');

/**
 * Endpoint for Spring Boot to verify token identity without sharing database
 * GET /api/integration/verify-token
 */
exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(ApiError.unauthorized('Bearer token required'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await User.findById(decoded.sub || decoded.id);
    if (!user || !user.isActive) {
      return next(ApiError.unauthorized('User not found or inactive'));
    }

    return ApiResponse.success(res, {
      isValid: true,
      user: {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    return next(ApiError.unauthorized('Token verification failed: ' + err.message));
  }
};

/**
 * Endpoint for Spring Boot to verify if a user is eligible to join a course-linked live session
 * GET /api/integration/courses/:courseId/verify-participant?userId=...
 */
exports.verifyParticipant = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return next(ApiError.badRequest('userId query parameter is required'));
    }

    const course = await Course.findById(courseId);
    if (!course || course.isArchived) {
      return next(ApiError.notFound('Course not found or archived'));
    }

    const isTeacher = course.teacherId.toString() === userId;
    if (isTeacher) {
      return ApiResponse.success(res, {
        isEligible: true,
        roleInCourse: 'teacher',
        courseTitle: course.title,
      });
    }

    const enrollment = await Enrollment.findOne({ courseId, studentId: userId, status: 'active' });
    if (!enrollment) {
      return ApiResponse.success(res, {
        isEligible: false,
        roleInCourse: 'none',
        reason: 'Student is not enrolled in this course',
      });
    }

    return ApiResponse.success(res, {
      isEligible: true,
      roleInCourse: 'student',
      courseTitle: course.title,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export/Sync live session attendance from Spring Boot to MERN course attendance register
 * POST /api/integration/sessions/:sessionId/sync-attendance
 */
exports.syncLiveSessionAttendance = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { courseId, teacherId, sessionDate, participants } = req.body;

    if (!courseId || !participants || !Array.isArray(participants)) {
      return next(ApiError.badRequest('courseId and participants array are required'));
    }

    const targetDate = sessionDate || new Date().toISOString().split('T')[0];

    let attendance = await AttendanceRecord.findOne({ courseId, classDate: targetDate });
    if (!attendance) {
      attendance = await AttendanceRecord.create({
        courseId,
        classDate: targetDate,
        title: `Live Session ${sessionId} Attendance`,
        records: [],
        createdBy: teacherId,
        isConfirmed: false,
      });
    }

    let addedCount = 0;
    for (const p of participants) {
      const studentId = p.userId || p.studentId;
      if (!studentId) continue;

      const exists = attendance.records.some(r => r.studentId.toString() === String(studentId));
      if (!exists) {
        attendance.records.push({
          studentId,
          status: 'present',
          checkInTime: p.joinedAt ? new Date(p.joinedAt) : new Date(),
          source: 'spring_boot_session',
          notes: `Live Session ID: ${sessionId}`,
        });
        addedCount++;
      }
    }

    await attendance.save();

    await AuditService.log({
      userId: teacherId || null,
      action: 'SPRING_BOOT_LIVE_ATTENDANCE_SYNCED',
      entityType: 'AttendanceRecord',
      entityId: attendance._id,
      details: { sessionId, courseId, addedCount },
      ipAddress: req.ip,
    });

    return ApiResponse.success(
      res,
      {
        synced: true,
        attendanceRecordId: attendance._id,
        addedCount,
      },
      'Live session attendance synced to course register'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Returns API contract specification details for cross-service documentation
 * GET /api/integration/contract
 */
exports.getIntegrationContract = (req, res) => {
  return ApiResponse.success(res, {
    serviceName: 'ClassPulse MERN Learning Workspace',
    version: '1.0.0',
    sharedAuth: {
      algorithm: 'HS256',
      claims: {
        sub: 'User MongoDB ObjectId string',
        email: 'User email string',
        role: 'teacher | student | admin',
        name: 'User full name',
      },
    },
    providedEndpoints: [
      {
        method: 'GET',
        endpoint: '/api/integration/verify-token',
        description: 'Verify JWT and retrieve user profile',
      },
      {
        method: 'GET',
        endpoint: '/api/integration/courses/:courseId/verify-participant?userId={id}',
        description: 'Check if user is enrolled in course before entering live session',
      },
      {
        method: 'POST',
        endpoint: '/api/integration/sessions/:sessionId/sync-attendance',
        description: 'Sync participant list to MERN course attendance register',
      },
    ],
    springBootExpectedEndpoints: [
      {
        method: 'POST',
        endpoint: '/api/live-sessions',
        description: 'Teacher creates live session linked to courseId and teacherId',
      },
      {
        method: 'GET',
        endpoint: '/api/live-sessions/{sessionId}/results',
        description: 'Retrieve live quiz/poll results for gradebook export',
      },
    ],
  });
};
