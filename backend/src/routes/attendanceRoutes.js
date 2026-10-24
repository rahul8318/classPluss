const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middlewares/auth');
const { verifyCourseAccess, verifyTeacherCourseOwnership } = require('../middlewares/courseAccess');

router.use(authenticate);

// Course attendance register and manual marking
router.get('/courses/:courseId/attendance', verifyCourseAccess, attendanceController.getCourseAttendance);
router.post('/courses/:courseId/attendance', verifyTeacherCourseOwnership, attendanceController.recordAttendance);
router.put(
  '/attendance/:recordId/students/:studentId',
  authorize('teacher', 'admin'),
  attendanceController.updateStudentAttendance
);

// Attendance session codes & check-in
router.post(
  '/courses/:courseId/attendance/session-code',
  verifyTeacherCourseOwnership,
  attendanceController.generateSessionCode
);
router.post('/attendance/check-in', authorize('student', 'admin'), attendanceController.studentCheckIn);

// Import live session attendance from Spring Boot
router.post(
  '/courses/:courseId/attendance/import-live-session',
  verifyTeacherCourseOwnership,
  attendanceController.importFromSpringBoot
);

// Reports
router.get('/courses/:courseId/attendance/report', verifyTeacherCourseOwnership, attendanceController.getAttendanceReport);

module.exports = router;
