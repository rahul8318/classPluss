const Resource = require('../models/Resource');
const QuestionBank = require('../models/QuestionBank');
const StudyChatSession = require('../models/StudyChatSession');
const QuestionGenService = require('../services/questionGenService');
const AiService = require('../services/aiService');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const AuditService = require('../services/auditService');

exports.generateQuestions = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const {
      topic = 'General',
      sourceResourceId,
      sourceText = '',
      questionTypes = ['mcq', 'true_false', 'short_answer'],
      difficulty = 'medium',
      count = 5,
      bloomLevel = 'Understand',
      saveToQuestionBank = false,
      questionBankTitle = '',
    } = req.body;

    let contentToUse = sourceText;

    // If sourceResourceId is provided, load extracted text from Resource
    if (sourceResourceId) {
      const resource = await Resource.findById(sourceResourceId);
      if (resource && resource.textContent) {
        contentToUse = resource.textContent;
      }
    }

    const generatedQuestions = await QuestionGenService.generateQuestions({
      sourceText: contentToUse,
      topic,
      questionTypes,
      difficulty,
      count: Math.min(Number(count) || 5, 20),
      bloomLevel,
    });

    let savedQuestionBank = null;
    if (saveToQuestionBank) {
      savedQuestionBank = await QuestionBank.create({
        courseId,
        title: questionBankTitle || `AI Generated Bank - ${topic} (${new Date().toLocaleDateString()})`,
        topic,
        sourceResourceId: sourceResourceId || undefined,
        sourceNotes: `Generated with difficulty: ${difficulty}, Bloom level: ${bloomLevel}`,
        questions: generatedQuestions,
        createdBy: req.user.id,
      });
    }

    await AuditService.log({
      userId: req.user.id,
      action: 'AI_QUESTIONS_GENERATED',
      entityType: 'Course',
      entityId: courseId,
      details: { topic, count: generatedQuestions.length, difficulty },
      ipAddress: req.ip,
    });

    return ApiResponse.success(
      res,
      {
        questions: generatedQuestions,
        questionBank: savedQuestionBank,
        meta: {
          topic,
          difficulty,
          bloomLevel,
          count: generatedQuestions.length,
          isDraft: true,
          notice: 'These questions are AI-generated drafts. Please review and verify before administering in assessments.',
        },
      },
      'Questions generated successfully'
    );
  } catch (error) {
    next(error);
  }
};

exports.studyChat = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const { question, level = 'standard', sessionId } = req.body;
    const studentId = req.user.id;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return next(ApiError.badRequest('Question text is required'));
    }

    // Retrieve or create chat session
    let session;
    if (sessionId) {
      session = await StudyChatSession.findOne({ _id: sessionId, studentId, courseId });
    }
    if (!session) {
      session = await StudyChatSession.findOne({ studentId, courseId }).sort({ updatedAt: -1 });
    }
    if (!session) {
      session = await StudyChatSession.create({
        courseId,
        studentId,
        title: question.substring(0, 40) + '...',
        messages: [],
      });
    }

    // Get response from grounded RAG pipeline
    const ragResult = await AiService.answerCourseQuestion({
      courseId,
      question,
      level,
      history: session.messages,
    });

    // Record user question in session
    session.messages.push({
      role: 'user',
      content: question,
      level,
      timestamp: new Date(),
    });

    // Record assistant response with sources
    session.messages.push({
      role: 'assistant',
      content: ragResult.answer,
      level: ragResult.level,
      sources: ragResult.sources,
      timestamp: new Date(),
    });

    await session.save();

    return ApiResponse.success(res, {
      sessionId: session._id,
      answer: ragResult.answer,
      sources: ragResult.sources,
      level: ragResult.level,
      isFallback: ragResult.isFallback,
    });
  } catch (error) {
    next(error);
  }
};

exports.getChatHistory = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const studentId = req.user.id;

    const sessions = await StudyChatSession.find({ courseId, studentId }).sort({ updatedAt: -1 });
    return ApiResponse.success(res, { sessions });
  } catch (error) {
    next(error);
  }
};

exports.clearChatSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const studentId = req.user.id;

    await StudyChatSession.deleteOne({ _id: sessionId, studentId });
    return ApiResponse.success(res, null, 'Chat session cleared successfully');
  } catch (error) {
    next(error);
  }
};
