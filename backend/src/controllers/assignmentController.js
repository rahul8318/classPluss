const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Notification = require('../models/Notification');
const Enrollment = require('../models/Enrollment');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const AuditService = require('../services/auditService');

exports.createAssignment = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const {
      title,
      description,
      instructions,
      attachments,
      dueDate,
      totalMarks,
      allowedSubmissionTypes,
      lateSubmissionPolicy,
      latePenaltyPercent,
      rubric,
    } = req.body;

    if (!title || !description || !dueDate) {
      return next(ApiError.badRequest('Title, description, and dueDate are required'));
    }

    const assignment = await Assignment.create({
      courseId,
      title,
      description,
      instructions: instructions || '',
      attachments: attachments || [],
      dueDate: new Date(dueDate),
      totalMarks: totalMarks !== undefined ? Number(totalMarks) : 100,
      allowedSubmissionTypes: allowedSubmissionTypes || ['file', 'text'],
      lateSubmissionPolicy: lateSubmissionPolicy || 'allow',
      latePenaltyPercent: latePenaltyPercent !== undefined ? Number(latePenaltyPercent) : 10,
      rubric: rubric || [],
      createdBy: req.user.id,
    });

    // Notify all enrolled students
    const enrollments = await Enrollment.find({ courseId, status: 'active' }).select('studentId');
    const notifications = enrollments.map(e => ({
      userId: e.studentId,
      title: 'New Assignment Posted',
      message: `A new assignment "${assignment.title}" has been posted. Due: ${new Date(dueDate).toLocaleDateString()}`,
      type: 'assignment',
      link: `/courses/${courseId}/assignments/${assignment._id}`,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    await AuditService.log({
      userId: req.user.id,
      action: 'ASSIGNMENT_CREATED',
      entityType: 'Assignment',
      entityId: assignment._id,
      details: { title: assignment.title, dueDate: assignment.dueDate },
      ipAddress: req.ip,
    });

    return ApiResponse.created(res, { assignment }, 'Assignment created successfully');
  } catch (error) {
    next(error);
  }
};

exports.getCourseAssignments = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const query = { courseId };

    if (!req.isTeacher) {
      query.isPublished = true;
    }

    const assignments = await Assignment.find(query).sort({ dueDate: 1 }).lean();

    // If student, attach their submission status
    if (!req.isTeacher) {
      const studentId = req.user.id;
      const enhanced = await Promise.all(
        assignments.map(async assign => {
          const submission = await Submission.findOne({
            assignmentId: assign._id,
            studentId,
          }).select('status submittedAt isLate receiptCode');

          return {
            ...assign,
            submissionStatus: submission ? submission.status : 'not_submitted',
            mySubmission: submission || null,
          };
        })
      );
      return ApiResponse.success(res, { assignments: enhanced });
    }

    // If teacher, attach submission counts
    const enhancedTeacher = await Promise.all(
      assignments.map(async assign => {
        const totalSubmissions = await Submission.countDocuments({ assignmentId: assign._id });
        const gradedCount = await Submission.countDocuments({ assignmentId: assign._id, status: 'graded' });
        return {
          ...assign,
          totalSubmissions,
          gradedCount,
        };
      })
    );

    return ApiResponse.success(res, { assignments: enhancedTeacher });
  } catch (error) {
    next(error);
  }
};

exports.getAssignmentById = async (req, res, next) => {
  try {
    const { id, assignmentId } = req.params;
    const targetId = assignmentId || id;

    const assignment = await Assignment.findById(targetId).populate('createdBy', 'name email');
    if (!assignment) {
      return next(ApiError.notFound('Assignment not found'));
    }

    let mySubmission = null;
    if (!req.isTeacher) {
      mySubmission = await Submission.findOne({
        assignmentId: assignment._id,
        studentId: req.user.id,
      });
    }

    return ApiResponse.success(res, { assignment, mySubmission });
  } catch (error) {
    next(error);
  }
};

exports.updateAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const updateData = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return next(ApiError.notFound('Assignment not found'));
    }

    Object.assign(assignment, updateData);
    if (updateData.dueDate) {
      assignment.dueDate = new Date(updateData.dueDate);
    }

    await assignment.save();
    return ApiResponse.success(res, { assignment }, 'Assignment updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return next(ApiError.notFound('Assignment not found'));
    }

    await Assignment.deleteOne({ _id: assignmentId });
    return ApiResponse.success(res, null, 'Assignment deleted successfully');
  } catch (error) {
    next(error);
  }
};
