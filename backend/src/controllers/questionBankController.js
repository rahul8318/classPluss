const QuestionBank = require('../models/QuestionBank');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

exports.createQuestionBank = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const { title, topic, description, sourceResourceId, questions } = req.body;

    if (!title) {
      return next(ApiError.badRequest('Question bank title is required'));
    }

    const questionBank = await QuestionBank.create({
      courseId,
      title,
      topic: topic || 'General',
      description: description || '',
      sourceResourceId: sourceResourceId || undefined,
      questions: questions || [],
      createdBy: req.user.id,
    });

    return ApiResponse.created(res, { questionBank }, 'Question bank created successfully');
  } catch (error) {
    next(error);
  }
};

exports.getCourseQuestionBanks = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const banks = await QuestionBank.find({ courseId })
      .populate('sourceResourceId', 'title fileName')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, { questionBanks: banks });
  } catch (error) {
    next(error);
  }
};

exports.getQuestionBankById = async (req, res, next) => {
  try {
    const { bankId } = req.params;
    const bank = await QuestionBank.findById(bankId)
      .populate('sourceResourceId', 'title fileName')
      .populate('createdBy', 'name');

    if (!bank) {
      return next(ApiError.notFound('Question bank not found'));
    }

    return ApiResponse.success(res, { questionBank: bank });
  } catch (error) {
    next(error);
  }
};

exports.addQuestion = async (req, res, next) => {
  try {
    const { bankId } = req.params;
    const { text, questionType, options, answerKey, explanation, difficulty, bloomLevel, points } = req.body;

    if (!text || !questionType) {
      return next(ApiError.badRequest('Question text and questionType are required'));
    }

    const bank = await QuestionBank.findById(bankId);
    if (!bank) {
      return next(ApiError.notFound('Question bank not found'));
    }

    bank.questions.push({
      text,
      questionType,
      options: options || [],
      answerKey: answerKey || '',
      explanation: explanation || '',
      difficulty: difficulty || 'medium',
      bloomLevel: bloomLevel || 'Understand',
      points: points || 1,
      isAiGenerated: false,
    });

    await bank.save();
    return ApiResponse.success(res, { questionBank: bank }, 'Question added successfully');
  } catch (error) {
    next(error);
  }
};

exports.updateQuestion = async (req, res, next) => {
  try {
    const { bankId, questionId } = req.params;
    const bank = await QuestionBank.findById(bankId);
    if (!bank) {
      return next(ApiError.notFound('Question bank not found'));
    }

    const question = bank.questions.id(questionId);
    if (!question) {
      return next(ApiError.notFound('Question not found in this bank'));
    }

    Object.assign(question, req.body);
    await bank.save();

    return ApiResponse.success(res, { questionBank: bank }, 'Question updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteQuestion = async (req, res, next) => {
  try {
    const { bankId, questionId } = req.params;
    const bank = await QuestionBank.findById(bankId);
    if (!bank) {
      return next(ApiError.notFound('Question bank not found'));
    }

    bank.questions.pull({ _id: questionId });
    await bank.save();

    return ApiResponse.success(res, { questionBank: bank }, 'Question deleted successfully');
  } catch (error) {
    next(error);
  }
};
