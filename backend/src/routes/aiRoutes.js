const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate, authorize } = require('../middlewares/auth');
const { verifyCourseAccess, verifyTeacherCourseOwnership } = require('../middlewares/courseAccess');

router.use(authenticate);

// Teacher AI Question Generation (supports both /courses/:courseId/questions/generate and /questions/generate)
router.post('/courses/:courseId/questions/generate', verifyTeacherCourseOwnership, aiController.generateQuestions);
router.post('/questions/generate', authorize('teacher', 'admin'), aiController.generateQuestions);

// Student RAG Study Assistant Chat (supports both /courses/:courseId/study-chat and /study-chat)
router.post('/courses/:courseId/study-chat', verifyCourseAccess, aiController.studyChat);
router.post('/study-chat', aiController.studyChat);
router.get('/courses/:courseId/study-chat/history', verifyCourseAccess, aiController.getChatHistory);
router.delete('/study-chat/:sessionId', aiController.clearChatSession);

module.exports = router;
