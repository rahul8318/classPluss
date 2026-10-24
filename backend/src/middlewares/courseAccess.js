const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const ApiError = require('../utils/apiError');

/**
 * Verify that user is either the teacher of the course OR an active enrolled student (or admin)
 */
const verifyCourseAccess = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id || req.body.courseId;
    if (!courseId) {
      return next(ApiError.badRequest('courseId parameter is required'));
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return next(ApiError.notFound('Course not found'));
    }

    const userId = req.user.id;
    const isTeacher = course.teacherId.toString() === userId || req.user.role === 'admin';

    if (isTeacher) {
      req.course = course;
      req.isTeacher = true;
      req.isEnrolled = true;
      return next();
    }

    // Check student enrollment
    const enrollment = await Enrollment.findOne({
      courseId: course._id,
      studentId: userId,
      status: 'active',
    });

    if (!enrollment) {
      return next(ApiError.forbidden('You are not enrolled in this course'));
    }

    req.course = course;
    req.isTeacher = false;
    req.isEnrolled = true;
    req.enrollment = enrollment;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verify specifically that the current user is the owner/teacher of the course (or admin)
 */
const verifyTeacherCourseOwnership = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id || req.body.courseId;
    if (!courseId) {
      return next(ApiError.badRequest('courseId parameter is required'));
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return next(ApiError.notFound('Course not found'));
    }

    const userId = req.user.id;
    const isTeacher = course.teacherId.toString() === userId || req.user.role === 'admin';

    if (!isTeacher) {
      return next(ApiError.forbidden('Only the assigned course teacher or admin can perform this operation'));
    }

    req.course = course;
    req.isTeacher = true;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { verifyCourseAccess, verifyTeacherCourseOwnership };
