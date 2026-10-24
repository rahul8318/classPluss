const express = require('express');
const router = express.Router({ mergeParams: true });
const moduleController = require('../controllers/moduleController');
const { authenticate, authorize } = require('../middlewares/auth');
const { verifyCourseAccess, verifyTeacherCourseOwnership } = require('../middlewares/courseAccess');

router.use(authenticate);

router.get('/', verifyCourseAccess, moduleController.getModules);
router.post('/', verifyTeacherCourseOwnership, moduleController.createModule);
router.put('/:moduleId', verifyTeacherCourseOwnership, moduleController.updateModule);
router.delete('/:moduleId', verifyTeacherCourseOwnership, moduleController.deleteModule);

module.exports = router;
