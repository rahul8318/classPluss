const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const submissionController = require('../controllers/submissionController');
const { authenticate, authorize } = require('../middlewares/auth');
const { verifyCourseAccess, verifyTeacherCourseOwnership } = require('../middlewares/courseAccess');
const upload = require('../middlewares/upload');

router.use(authenticate);

// Course-scoped assignment routes
router.get('/courses/:courseId/assignments', verifyCourseAccess, assignmentController.getCourseAssignments);
router.post('/courses/:courseId/assignments', verifyTeacherCourseOwnership, assignmentController.createAssignment);

// Single assignment routes
router.get('/assignments/:assignmentId', verifyCourseAccess, assignmentController.getAssignmentById);
router.put('/assignments/:assignmentId', verifyTeacherCourseOwnership, assignmentController.updateAssignment);
router.delete('/assignments/:assignmentId', verifyTeacherCourseOwnership, assignmentController.deleteAssignment);

// Assignment submissions
router.post(
  '/assignments/:assignmentId/submissions',
  authorize('student', 'admin'),
  upload.single('file'),
  submissionController.submitWork
);
router.get(
  '/assignments/:assignmentId/submissions/my',
  authorize('student', 'admin'),
  submissionController.getMySubmission
);
router.get(
  '/assignments/:assignmentId/submissions',
  authorize('teacher', 'admin'),
  submissionController.getAssignmentSubmissions
);

module.exports = router;
