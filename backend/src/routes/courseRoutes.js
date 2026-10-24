const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticate, authorize } = require('../middlewares/auth');
const { verifyCourseAccess, verifyTeacherCourseOwnership } = require('../middlewares/courseAccess');

router.use(authenticate);

// Courses list and creation
router.get('/', courseController.getMyCourses);
router.post('/', authorize('teacher', 'admin'), courseController.createCourse);

// Student enroll by invite code
router.post('/enroll', authorize('student', 'admin'), courseController.enrollByCode);

// Single course details, updates, archive
router.get('/:id', verifyCourseAccess, courseController.getCourseById);
router.put('/:id', verifyTeacherCourseOwnership, courseController.updateCourse);
router.delete('/:id', verifyTeacherCourseOwnership, courseController.deleteCourse);

// Course roster
router.get('/:id/students', verifyCourseAccess, courseController.getCourseStudents);
router.delete('/:id/students/:studentId', verifyTeacherCourseOwnership, courseController.removeStudent);

module.exports = router;
