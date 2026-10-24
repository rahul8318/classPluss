const Assessment = require('../models/Assessment');
const AssessmentAttempt = require('../models/AssessmentAttempt');
const QuestionBank = require('../models/QuestionBank');
const AutoGradeService = require('../services/autoGradeService');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const AuditService = require('../services/auditService');

exports.createAssessment = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const {
      title,
      description,
      questionBankId,
      questions,
      totalMarks,
      durationMinutes,
      maxAttempts,
      availabilityWindow,
      releaseSettings,
    } = req.body;

    if (!title) {
      return next(ApiError.badRequest('Assessment title is required'));
    }

    let assessmentQuestions = questions || [];

    // If questionBankId is provided, import questions from the question bank
    if (questionBankId) {
      const bank = await QuestionBank.findById(questionBankId);
      if (bank && bank.questions.length > 0) {
        assessmentQuestions = bank.questions.map(q => ({
          text: q.text,
          questionType: q.questionType,
          options: q.options,
          answerKey: q.answerKey,
          explanation: q.explanation,
          points: q.points || 1,
        }));
      }
    }

    if (assessmentQuestions.length === 0) {
      return next(ApiError.badRequest('Assessment must contain at least one question'));
    }

    const calculatedTotalMarks = totalMarks
      ? Number(totalMarks)
      : assessmentQuestions.reduce((sum, q) => sum + (q.points || 1), 0);

    const assessment = await Assessment.create({
      courseId,
      title,
      description: description || '',
      questionBankId: questionBankId || undefined,
      questions: assessmentQuestions,
      totalMarks: calculatedTotalMarks,
      durationMinutes: durationMinutes ? Number(durationMinutes) : 30,
      maxAttempts: maxAttempts ? Number(maxAttempts) : 1,
      availabilityWindow: availabilityWindow || { startTime: new Date() },
      releaseSettings: releaseSettings || {
        showScoreImmediately: true,
        showFeedbackImmediately: false,
        showCorrectAnswers: false,
      },
      createdBy: req.user.id,
    });

    await AuditService.log({
      userId: req.user.id,
      action: 'ASSESSMENT_CREATED',
      entityType: 'Assessment',
      entityId: assessment._id,
      details: { title: assessment.title, totalMarks: assessment.totalMarks },
      ipAddress: req.ip,
    });

    return ApiResponse.created(res, { assessment }, 'Assessment created successfully');
  } catch (error) {
    next(error);
  }
};

exports.getCourseAssessments = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const query = { courseId };

    if (!req.isTeacher) {
      query.isPublished = true;
    }

    const assessments = await Assessment.find(query).sort({ createdAt: -1 }).lean();

    // If student, attach attempt information
    if (!req.isTeacher) {
      const studentId = req.user.id;
      const enhanced = await Promise.all(
        assessments.map(async assess => {
          const attempts = await AssessmentAttempt.find({
            assessmentId: assess._id,
            studentId,
          }).select('attemptNumber status score percentage submittedAt startedAt');

          return {
            ...assess,
            // Hide answer keys from student view
            questions: assess.questions.map(q => ({
              _id: q._id,
              text: q.text,
              questionType: q.questionType,
              options: q.options.map(opt => ({ id: opt.id, text: opt.text })),
              points: q.points,
            })),
            attempts,
            attemptsUsed: attempts.length,
            canAttempt: attempts.length < assess.maxAttempts,
          };
        })
      );
      return ApiResponse.success(res, { assessments: enhanced });
    }

    return ApiResponse.success(res, { assessments });
  } catch (error) {
    next(error);
  }
};

exports.getAssessmentById = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return next(ApiError.notFound('Assessment not found'));
    }

    // Hide answer keys if student
    if (!req.isTeacher) {
      const sanitized = assessment.toObject();
      sanitized.questions = sanitized.questions.map(q => ({
        _id: q._id,
        text: q.text,
        questionType: q.questionType,
        options: q.options.map(opt => ({ id: opt.id, text: opt.text })),
        points: q.points,
      }));
      return ApiResponse.success(res, { assessment: sanitized });
    }

    return ApiResponse.success(res, { assessment });
  } catch (error) {
    next(error);
  }
};

exports.startAttempt = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const studentId = req.user.id;

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return next(ApiError.notFound('Assessment not found'));
    }

    // Check availability window
    const now = new Date();
    if (assessment.availabilityWindow?.startTime && now < new Date(assessment.availabilityWindow.startTime)) {
      return next(ApiError.badRequest('This assessment has not opened yet'));
    }
    if (assessment.availabilityWindow?.endTime && now > new Date(assessment.availabilityWindow.endTime)) {
      return next(ApiError.badRequest('This assessment availability window has closed'));
    }

    // Check attempts count
    const attemptCount = await AssessmentAttempt.countDocuments({ assessmentId, studentId });
    if (attemptCount >= assessment.maxAttempts) {
      return next(ApiError.badRequest(`Maximum attempts limit (${assessment.maxAttempts}) reached for this assessment`));
    }

    const attempt = await AssessmentAttempt.create({
      assessmentId,
      courseId: assessment.courseId,
      studentId,
      attemptNumber: attemptCount + 1,
      startedAt: now,
      status: 'in_progress',
    });

    // Provide student with questions (excluding answer keys)
    const sanitizedQuestions = assessment.questions.map(q => ({
      _id: q._id,
      text: q.text,
      questionType: q.questionType,
      options: q.options.map(opt => ({ id: opt.id, text: opt.text })),
      points: q.points,
    }));

    return ApiResponse.created(
      res,
      {
        attemptId: attempt._id,
        startedAt: attempt.startedAt,
        durationMinutes: assessment.durationMinutes,
        questions: sanitizedQuestions,
      },
      'Assessment attempt started'
    );
  } catch (error) {
    next(error);
  }
};

exports.submitAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body; // Array of { questionId, selectedOptionId, textAnswer }
    const studentId = req.user.id;

    const attempt = await AssessmentAttempt.findOne({ _id: attemptId, studentId });
    if (!attempt) {
      return next(ApiError.notFound('Attempt not found or unauthorized'));
    }

    if (attempt.status !== 'in_progress') {
      return next(ApiError.badRequest('This attempt has already been submitted'));
    }

    const assessment = await Assessment.findById(attempt.assessmentId);
    if (!assessment) {
      return next(ApiError.notFound('Assessment not found'));
    }

    // Auto-grade objective questions
    const { scoredAnswers, totalScore, maxScore, isFullyGraded } = AutoGradeService.gradeAttempt(
      assessment.questions,
      answers || []
    );

    attempt.answers = scoredAnswers;
    attempt.score = totalScore;
    attempt.totalPossibleScore = maxScore;
    attempt.percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100 * 100) / 100 : 0;
    attempt.status = isFullyGraded ? 'graded' : 'submitted';
    attempt.isAutoGraded = true;
    attempt.submittedAt = new Date();

    await attempt.save();

    await AuditService.log({
      userId: studentId,
      action: 'ASSESSMENT_SUBMITTED',
      entityType: 'AssessmentAttempt',
      entityId: attempt._id,
      details: { assessmentId: assessment._id, score: totalScore, maxScore },
      ipAddress: req.ip,
    });

    // Determine what to return based on releaseSettings
    const responseData = {
      attemptId: attempt._id,
      submittedAt: attempt.submittedAt,
      status: attempt.status,
    };

    if (assessment.releaseSettings.showScoreImmediately) {
      responseData.score = attempt.score;
      responseData.totalPossibleScore = attempt.totalPossibleScore;
      responseData.percentage = attempt.percentage;
    }

    if (assessment.releaseSettings.showFeedbackImmediately || assessment.releaseSettings.showCorrectAnswers) {
      responseData.answers = attempt.answers;
    }

    return ApiResponse.success(res, responseData, 'Assessment attempt submitted successfully');
  } catch (error) {
    next(error);
  }
};

exports.getAssessmentResults = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return next(ApiError.notFound('Assessment not found'));
    }

    const attempts = await AssessmentAttempt.find({ assessmentId, status: { $in: ['submitted', 'graded'] } })
      .populate('studentId', 'name email avatar')
      .sort({ score: -1 });

    const totalAttempts = attempts.length;
    let averageScore = 0;
    let highestScore = 0;
    let lowestScore = totalAttempts > 0 ? 100 : 0;

    if (totalAttempts > 0) {
      const sum = attempts.reduce((acc, a) => acc + (a.percentage || 0), 0);
      averageScore = Math.round((sum / totalAttempts) * 10) / 10;
      highestScore = Math.max(...attempts.map(a => a.percentage || 0));
      lowestScore = Math.min(...attempts.map(a => a.percentage || 0));
    }

    // Question statistics: identify questions many students missed
    const questionStats = assessment.questions.map(q => {
      const qId = String(q._id);
      let answeredCount = 0;
      let correctCount = 0;

      for (const att of attempts) {
        const studentAns = att.answers.find(a => a.questionId === qId);
        if (studentAns) {
          answeredCount++;
          if (studentAns.isCorrect) correctCount++;
        }
      }

      const passRate = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

      return {
        questionId: q._id,
        text: q.text,
        questionType: q.questionType,
        answeredCount,
        correctCount,
        passRate,
        isCommonlyMissed: passRate < 50 && answeredCount > 0,
      };
    });

    return ApiResponse.success(res, {
      assessment,
      analytics: {
        totalAttempts,
        averageScore,
        highestScore,
        lowestScore,
      },
      questionStats,
      attempts,
    });
  } catch (error) {
    next(error);
  }
};

exports.gradeSubjectiveAnswer = async (req, res, next) => {
  try {
    const { attemptId, questionId } = req.params;
    const { pointsAwarded, teacherComment } = req.body;

    const attempt = await AssessmentAttempt.findById(attemptId);
    if (!attempt) {
      return next(ApiError.notFound('Attempt not found'));
    }

    const answer = attempt.answers.find(a => a.questionId === questionId);
    if (!answer) {
      return next(ApiError.notFound('Answer for this question not found in attempt'));
    }

    answer.pointsAwarded = Number(pointsAwarded) || 0;
    answer.teacherComment = teacherComment || '';
    answer.isCorrect = (Number(pointsAwarded) || 0) > 0;

    // Recalculate total score
    const newScore = attempt.answers.reduce((sum, a) => sum + (a.pointsAwarded || 0), 0);
    attempt.score = newScore;
    if (attempt.totalPossibleScore > 0) {
      attempt.percentage = Math.round((newScore / attempt.totalPossibleScore) * 100 * 100) / 100;
    }

    // Check if all subjective questions are graded
    const remainingUngraded = attempt.answers.some(a => a.isCorrect === null);
    if (!remainingUngraded) {
      attempt.status = 'graded';
    }

    await attempt.save();
    return ApiResponse.success(res, { attempt }, 'Subjective question graded successfully');
  } catch (error) {
    next(error);
  }
};
