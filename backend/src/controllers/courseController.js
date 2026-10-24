const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const CourseModule = require('../models/CourseModule');
const Resource = require('../models/Resource');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const AuditService = require('../services/auditService');

// Helper to generate unique human-readable course code like CP-8921
const generateCourseCode = async () => {
  for (let i = 0; i < 10; i++) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const candidateCode = `CP-${randomDigits}`;
    const exists = await Course.findOne({ code: candidateCode });
    if (!exists) return candidateCode;
  }
  return `CP-${Date.now().toString().slice(-6)}`;
};

exports.createCourse = async (req, res, next) => {
  try {
    const { title, description, subject, level, term, bannerImage } = req.body;

    if (!title) {
      return next(ApiError.badRequest('Course title is required'));
    }

    const code = req.body.code ? req.body.code.toUpperCase().trim() : await generateCourseCode();

    const existing = await Course.findOne({ code });
    if (existing) {
      return next(ApiError.conflict(`Course code '${code}' is already in use`));
    }

    const course = await Course.create({
      title,
      description: description || '',
      subject: subject || 'General',
      level: level || 'Intermediate',
      term: term || 'Current Term',
      code,
      teacherId: req.user.id,
      bannerImage: bannerImage || '',
    });

    await AuditService.log({
      userId: req.user.id,
      action: 'COURSE_CREATED',
      entityType: 'Course',
      entityId: course._id,
      details: { code: course.code, title: course.title },
      ipAddress: req.ip,
    });

    return ApiResponse.created(res, { course }, 'Course created successfully');
  } catch (error) {
    next(error);
  }
};

exports.getMyCourses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let courses = [];

    if (role === 'teacher' || role === 'admin') {
      courses = await Course.find({ teacherId: userId, isArchived: false })
        .populate('teacherId', 'name email avatar')
        .sort({ createdAt: -1 })
        .lean();
    } else {
      // For student: find all active enrollments
      const enrollments = await Enrollment.find({ studentId: userId, status: 'active' }).select('courseId');
      const courseIds = enrollments.map(e => e.courseId);

      courses = await Course.find({ _id: { $in: courseIds }, isArchived: false })
        .populate('teacherId', 'name email avatar')
        .sort({ createdAt: -1 })
        .lean();
    }

    // Attach counts for each course
    const enhancedCourses = await Promise.all(
      courses.map(async course => {
        const studentCount = await Enrollment.countDocuments({ courseId: course._id, status: 'active' });
        const moduleCount = await CourseModule.countDocuments({ courseId: course._id });
        const assignmentCount = await Assignment.countDocuments({ courseId: course._id });
        return {
          ...course,
          studentCount,
          moduleCount,
          assignmentCount,
        };
      })
    );

    return ApiResponse.success(res, { courses: enhancedCourses });
  } catch (error) {
    next(error);
  }
};

exports.getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).populate('teacherId', 'name email avatar bio');
    if (!course) {
      return next(ApiError.notFound('Course not found'));
    }

    const studentCount = await Enrollment.countDocuments({ courseId: course._id, status: 'active' });
    const moduleCount = await CourseModule.countDocuments({ courseId: course._id });
    const assignmentCount = await Assignment.countDocuments({ courseId: course._id });
    const resourceCount = await Resource.countDocuments({ courseId: course._id, isPublished: true });

    return ApiResponse.success(res, {
      course,
      stats: {
        studentCount,
        moduleCount,
        assignmentCount,
        resourceCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const { title, description, subject, level, term, isArchived, bannerImage } = req.body;
    const course = req.course;

    if (title) course.title = title;
    if (description !== undefined) course.description = description;
    if (subject !== undefined) course.subject = subject;
    if (level !== undefined) course.level = level;
    if (term !== undefined) course.term = term;
    if (isArchived !== undefined) course.isArchived = isArchived;
    if (bannerImage !== undefined) course.bannerImage = bannerImage;

    await course.save();

    await AuditService.log({
      userId: req.user.id,
      action: 'COURSE_UPDATED',
      entityType: 'Course',
      entityId: course._id,
      details: { title: course.title, isArchived: course.isArchived },
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, { course }, 'Course updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const course = req.course;
    course.isArchived = true;
    await course.save();

    await AuditService.log({
      userId: req.user.id,
      action: 'COURSE_ARCHIVED',
      entityType: 'Course',
      entityId: course._id,
      details: { title: course.title },
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, null, 'Course archived successfully');
  } catch (error) {
    next(error);
  }
};

exports.enrollByCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return next(ApiError.badRequest('Course code is required'));
    }

    const course = await Course.findOne({ code: code.toUpperCase().trim(), isArchived: false });
    if (!course) {
      return next(ApiError.notFound('Invalid course code or course is archived'));
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      courseId: course._id,
      studentId: req.user.id,
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'active') {
        return next(ApiError.conflict('You are already actively enrolled in this course'));
      }
      existingEnrollment.status = 'active';
      existingEnrollment.droppedAt = null;
      await existingEnrollment.save();

      return ApiResponse.success(res, { course, enrollment: existingEnrollment }, 'Re-enrolled in course successfully');
    }

    const enrollment = await Enrollment.create({
      courseId: course._id,
      studentId: req.user.id,
      status: 'active',
    });

    await AuditService.log({
      userId: req.user.id,
      action: 'STUDENT_ENROLLED',
      entityType: 'Enrollment',
      entityId: enrollment._id,
      details: { courseId: course._id, courseCode: course.code },
      ipAddress: req.ip,
    });

    return ApiResponse.created(res, { course, enrollment }, 'Enrolled in course successfully');
  } catch (error) {
    next(error);
  }
};

exports.getCourseStudents = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const enrollments = await Enrollment.find({ courseId, status: 'active' })
      .populate('studentId', 'name email avatar')
      .sort({ enrolledAt: 1 });

    const students = enrollments.map(e => ({
      enrollmentId: e._id,
      enrolledAt: e.enrolledAt,
      status: e.status,
      student: e.studentId,
    }));

    return ApiResponse.success(res, { students, count: students.length });
  } catch (error) {
    next(error);
  }
};

exports.removeStudent = async (req, res, next) => {
  try {
    const { id: courseId, studentId } = req.params;

    const enrollment = await Enrollment.findOne({ courseId, studentId });
    if (!enrollment) {
      return next(ApiError.notFound('Enrollment not found'));
    }

    enrollment.status = 'dropped';
    enrollment.droppedAt = new Date();
    await enrollment.save();

    await AuditService.log({
      userId: req.user.id,
      action: 'STUDENT_REMOVED',
      entityType: 'Enrollment',
      entityId: enrollment._id,
      details: { courseId, studentId },
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, null, 'Student removed from course successfully');
  } catch (error) {
    next(error);
  }
};
