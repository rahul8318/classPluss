const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middlewares/auth');
const { verifyCourseAccess, verifyTeacherCourseOwnership } = require('../middlewares/courseAccess');

router.use(authenticate);

// Reports & static routes (mounted before :recordId dynamic routes)
router.get('/courses/:courseId/attendance/report', verifyTeacherCourseOwnership, attendanceController.getAttendanceReport);
router.post(
  '/courses/:courseId/attendance/session-code',
  verifyTeacherCourseOwnership,
  attendanceController.generateSessionCode
);
router.post(
  '/courses/:courseId/attendance/import-live-session',
  verifyTeacherCourseOwnership,
  attendanceController.importFromSpringBoot
);

// Course attendance register and session details
router.get('/courses/:courseId/attendance', verifyCourseAccess, attendanceController.getCourseAttendance);
router.get('/courses/:courseId/attendance/:recordId', verifyCourseAccess, attendanceController.getSessionAttendance);
router.post('/courses/:courseId/attendance', verifyTeacherCourseOwnership, attendanceController.recordAttendance);
router.delete('/attendance/:recordId', verifyTeacherCourseOwnership, attendanceController.deleteAttendanceRecord);
router.put(
  '/attendance/:recordId/students/:studentId',
  authorize('teacher', 'admin'),
  attendanceController.updateStudentAttendance
);

router.post('/attendance/check-in', authorize('student', 'admin'), attendanceController.studentCheckIn);

module.exports = router;
