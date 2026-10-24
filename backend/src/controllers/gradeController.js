const GradeFeedback = require('../models/GradeFeedback');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const AuditService = require('../services/auditService');

exports.gradeSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { marksObtained, rubricScores, feedbackText, status } = req.body;

    if (marksObtained === undefined || marksObtained === null) {
      return next(ApiError.badRequest('marksObtained is required'));
    }

    const submission = await Submission.findById(submissionId).populate('assignmentId');
    if (!submission) {
      return next(ApiError.notFound('Submission not found'));
    }

    const assignment = submission.assignmentId;
    let finalMarks = Number(marksObtained);

    // Apply late penalty if policy dictates
    if (submission.isLate && assignment.lateSubmissionPolicy === 'penalty') {
      const penalty = (finalMarks * (assignment.latePenaltyPercent || 10)) / 100;
      finalMarks = Math.max(0, Math.round((finalMarks - penalty) * 10) / 10);
    }

    let grade = await GradeFeedback.findOne({ submissionId });
    if (grade) {
      grade.marksObtained = finalMarks;
      grade.totalMarks = assignment.totalMarks;
      grade.rubricScores = rubricScores || grade.rubricScores;
      grade.feedbackText = feedbackText !== undefined ? feedbackText : grade.feedbackText;
      grade.status = status || 'published';
      grade.gradedBy = req.user.id;
      grade.gradedAt = new Date();
      await grade.save();
    } else {
      grade = await GradeFeedback.create({
        submissionId,
        assignmentId: assignment._id,
        courseId: assignment.courseId,
        studentId: submission.studentId,
        marksObtained: finalMarks,
        totalMarks: assignment.totalMarks,
        rubricScores: rubricScores || [],
        feedbackText: feedbackText || '',
        status: status || 'published',
        gradedBy: req.user.id,
      });
    }

    submission.status = 'graded';
    await submission.save();

    // Notify student if grade is published
    if (grade.status === 'published') {
      await Notification.create({
        userId: submission.studentId,
        title: 'Assignment Graded',
        message: `Your work for "${assignment.title}" has been graded: ${finalMarks}/${assignment.totalMarks}`,
        type: 'grade',
        link: `/courses/${assignment.courseId}/assignments/${assignment._id}`,
      });
    }

    await AuditService.log({
      userId: req.user.id,
      action: 'GRADE_SUBMITTED',
      entityType: 'GradeFeedback',
      entityId: grade._id,
      details: { submissionId, marksObtained: finalMarks, totalMarks: assignment.totalMarks },
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, { grade }, 'Grade and feedback recorded successfully');
  } catch (error) {
    next(error);
  }
};

exports.getCourseGradebook = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;

    // Get all enrolled students
    const enrollments = await Enrollment.find({ courseId, status: 'active' }).populate('studentId', 'name email avatar');
    const assignments = await Assignment.find({ courseId }).sort({ dueDate: 1 });
    const grades = await GradeFeedback.find({ courseId, status: 'published' }).lean();

    const gradeMap = new Map();
    for (const g of grades) {
      const key = `${g.studentId}_${g.assignmentId}`;
      gradeMap.set(key, g);
    }

    const gradebook = enrollments.map(e => {
      const student = e.studentId;
      const studentGrades = assignments.map(a => {
        const grade = gradeMap.get(`${student._id}_${a._id}`);
        return {
          assignmentId: a._id,
          assignmentTitle: a.title,
          totalMarks: a.totalMarks,
          marksObtained: grade ? grade.marksObtained : null,
          percentage: grade ? grade.percentage : null,
          graded: !!grade,
        };
      });

      const totalEarned = studentGrades.reduce((sum, g) => sum + (g.marksObtained || 0), 0);
      const totalPossible = studentGrades.reduce((sum, g) => (g.graded ? sum + g.totalMarks : sum), 0);
      const overallPercentage = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100 * 100) / 100 : 0;

      return {
        student,
        grades: studentGrades,
        totalEarned,
        totalPossible,
        overallPercentage,
      };
    });

    return ApiResponse.success(res, { gradebook, assignments });
  } catch (error) {
    next(error);
  }
};

exports.getMyGrades = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const studentId = req.user.id;

    const grades = await GradeFeedback.find({ courseId, studentId, status: 'published' })
      .populate('assignmentId', 'title dueDate totalMarks')
      .populate('gradedBy', 'name')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, { grades });
  } catch (error) {
    next(error);
  }
};
