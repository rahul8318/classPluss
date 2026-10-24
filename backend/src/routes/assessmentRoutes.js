const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessmentController');
const { authenticate, authorize } = require('../middlewares/auth');
const { verifyCourseAccess, verifyTeacherCourseOwnership } = require('../middlewares/courseAccess');

router.use(authenticate);

// Course assessments
router.post('/courses/:courseId/assessments', verifyTeacherCourseOwnership, assessmentController.createAssessment);
router.get('/courses/:courseId/assessments', verifyCourseAccess, assessmentController.getCourseAssessments);

// Assessment details
router.get('/assessments/:assessmentId', assessmentController.getAssessmentById);

// Student attempts
router.post('/assessments/:assessmentId/start', authorize('student', 'admin'), assessmentController.startAttempt);
router.post('/attempts/:attemptId/submit', authorize('student', 'admin'), assessmentController.submitAttempt);

// Teacher analytics and grading
router.get('/assessments/:assessmentId/results', authorize('teacher', 'admin'), assessmentController.getAssessmentResults);
router.put(
  '/attempts/:attemptId/questions/:questionId/grade',
  authorize('teacher', 'admin'),
  assessmentController.gradeSubjectiveAnswer
);

module.exports = router;
