const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { authenticate, authorize } = require('../middlewares/auth');
const { verifyCourseAccess, verifyTeacherCourseOwnership } = require('../middlewares/courseAccess');

router.use(authenticate);

// Grade submission
router.post('/submissions/:submissionId/grade', authorize('teacher', 'admin'), gradeController.gradeSubmission);

// Teacher gradebook matrix
router.get('/courses/:courseId/gradebook', verifyTeacherCourseOwnership, gradeController.getCourseGradebook);

// Student own grades
router.get('/courses/:courseId/my-grades', verifyCourseAccess, gradeController.getMyGrades);

module.exports = router;
