const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Notification = require('../models/Notification');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const AuditService = require('../services/auditService');

exports.submitWork = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { submissionType, content, linkUrl } = req.body;
    const studentId = req.user.id;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return next(ApiError.notFound('Assignment not found'));
    }

    const now = new Date();
    const isLate = now > new Date(assignment.dueDate);

    // Enforce late policy
    if (isLate && assignment.lateSubmissionPolicy === 'disallow') {
      return next(ApiError.badRequest('Submissions for this assignment are closed (Late submissions are not accepted)'));
    }

    let fileUrls = [];
    if (req.file) {
      fileUrls.push({
        url: `/uploads/${req.file.filename}`,
        name: req.file.originalname,
        size: req.file.size,
      });
    }

    // Check if previous submission exists
    const existingSubmission = await Submission.findOne({ assignmentId, studentId });
    const attemptNumber = existingSubmission ? existingSubmission.attemptNumber + 1 : 1;
    const receiptCode = `REC-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    let submission;
    if (existingSubmission) {
      existingSubmission.submissionType = submissionType || existingSubmission.submissionType;
      if (fileUrls.length > 0) existingSubmission.fileUrls = fileUrls;
      if (content) existingSubmission.content = content;
      if (linkUrl) existingSubmission.linkUrl = linkUrl;
      existingSubmission.submittedAt = now;
      existingSubmission.isLate = isLate;
      existingSubmission.status = 'submitted';
      existingSubmission.attemptNumber = attemptNumber;
      existingSubmission.receiptCode = receiptCode;
      submission = await existingSubmission.save();
    } else {
      submission = await Submission.create({
        assignmentId,
        courseId: assignment.courseId,
        studentId,
        submissionType: submissionType || (fileUrls.length > 0 ? 'file' : 'text'),
        fileUrls,
        content: content || '',
        linkUrl: linkUrl || '',
        submittedAt: now,
        isLate,
        status: 'submitted',
        attemptNumber,
        receiptCode,
      });
    }

    // Notify teacher
    await Notification.create({
      userId: assignment.createdBy,
      title: 'New Assignment Submission',
      message: `${req.user.name} submitted work for "${assignment.title}"${isLate ? ' (Late)' : ''}.`,
      type: 'assignment',
      link: `/courses/${assignment.courseId}/assignments/${assignment._id}/submissions`,
    });

    await AuditService.log({
      userId: studentId,
      action: 'ASSIGNMENT_SUBMITTED',
      entityType: 'Submission',
      entityId: submission._id,
      details: { assignmentId, isLate, receiptCode },
      ipAddress: req.ip,
    });

    return ApiResponse.created(
      res,
      {
        submission,
        receipt: {
          receiptCode,
          timestamp: submission.submittedAt,
          isLate,
          studentName: req.user.name,
        },
      },
      'Assignment submitted successfully'
    );
  } catch (error) {
    next(error);
  }
};

exports.getAssignmentSubmissions = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { status } = req.query;

    const filter = { assignmentId };
    if (status) {
      filter.status = status;
    }

    const submissions = await Submission.find(filter)
      .populate('studentId', 'name email avatar')
      .sort({ submittedAt: -1 });

    return ApiResponse.success(res, { submissions, count: submissions.length });
  } catch (error) {
    next(error);
  }
};

exports.getMySubmission = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const submission = await Submission.findOne({
      assignmentId,
      studentId: req.user.id,
    });

    if (!submission) {
      return ApiResponse.success(res, { submission: null }, 'No submission found for this assignment');
    }

    return ApiResponse.success(res, { submission });
  } catch (error) {
    next(error);
  }
};

exports.requestResubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { reason } = req.body;

    const submission = await Submission.findById(submissionId).populate('assignmentId', 'title courseId');
    if (!submission) {
      return next(ApiError.notFound('Submission not found'));
    }

    submission.status = 'resubmission_requested';
    await submission.save();

    await Notification.create({
      userId: submission.studentId,
      title: 'Resubmission Requested',
      message: `Your instructor requested a resubmission for "${submission.assignmentId.title}": ${reason || 'Please review feedback.'}`,
      type: 'assignment',
      link: `/courses/${submission.courseId}/assignments/${submission.assignmentId._id}`,
    });

    return ApiResponse.success(res, { submission }, 'Resubmission requested successfully');
  } catch (error) {
    next(error);
  }
};
