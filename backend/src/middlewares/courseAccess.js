const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Resource = require('../models/Resource');
const Assignment = require('../models/Assignment');
const Assessment = require('../models/Assessment');
const CourseModule = require('../models/CourseModule');
const ApiError = require('../utils/apiError');

/**
 * Helper to resolve courseId from route params, body, query, or linked entities
 */
const resolveCourseId = async (req) => {
  if (req.params.courseId) return req.params.courseId;
  if (req.params.id) return req.params.id;
  if (req.body && req.body.courseId) return req.body.courseId;
  if (req.query && req.query.courseId) return req.query.courseId;

  if (req.params.resourceId) {
    const resource = await Resource.findById(req.params.resourceId).select('courseId');
    if (resource) return resource.courseId;
  }
  if (req.params.assignmentId) {
    const assignment = await Assignment.findById(req.params.assignmentId).select('courseId');
    if (assignment) return assignment.courseId;
  }
  if (req.params.assessmentId) {
    const assessment = await Assessment.findById(req.params.assessmentId).select('courseId');
    if (assessment) return assessment.courseId;
  }
  if (req.params.moduleId) {
    const courseModule = await CourseModule.findById(req.params.moduleId).select('courseId');
    if (courseModule) return courseModule.courseId;
  }

  return null;
};

/**
 * Verify that user is either the teacher of the course OR an active enrolled student (or admin)
 */
const verifyCourseAccess = async (req, res, next) => {
  try {
    const courseId = await resolveCourseId(req);
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
    const courseId = await resolveCourseId(req);
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
