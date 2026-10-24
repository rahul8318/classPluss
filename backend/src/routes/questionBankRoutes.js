const express = require('express');
const router = express.Router();
const questionBankController = require('../controllers/questionBankController');
const { authenticate, authorize } = require('../middlewares/auth');
const { verifyTeacherCourseOwnership } = require('../middlewares/courseAccess');

router.use(authenticate);

// Course scoped question banks
router.post('/courses/:courseId/question-banks', authorize('teacher', 'admin'), verifyTeacherCourseOwnership, questionBankController.createQuestionBank);
router.get('/courses/:courseId/question-banks', authorize('teacher', 'admin'), verifyTeacherCourseOwnership, questionBankController.getCourseQuestionBanks);

// Single question bank operations
router.get('/question-banks/:bankId', authorize('teacher', 'admin'), questionBankController.getQuestionBankById);
router.post('/question-banks/:bankId/questions', authorize('teacher', 'admin'), questionBankController.addQuestion);
router.put('/question-banks/:bankId/questions/:questionId', authorize('teacher', 'admin'), questionBankController.updateQuestion);
router.delete('/question-banks/:bankId/questions/:questionId', authorize('teacher', 'admin'), questionBankController.deleteQuestion);

module.exports = router;
