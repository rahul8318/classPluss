const express = require('express');
const router = express.Router({ mergeParams: true });
const resourceController = require('../controllers/resourceController');
const { authenticate, authorize } = require('../middlewares/auth');
const { verifyCourseAccess, verifyTeacherCourseOwnership } = require('../middlewares/courseAccess');
const upload = require('../middlewares/upload');

router.use(authenticate);

// Course-scoped routes
router.get('/', verifyCourseAccess, resourceController.getResources);
router.post(
  '/',
  verifyTeacherCourseOwnership,
  upload.single('file'),
  resourceController.createResource
);

// Individual resource operations
router.get('/:resourceId', resourceController.getResourceById);
router.put('/:resourceId', verifyTeacherCourseOwnership, resourceController.updateResource);
router.delete('/:resourceId', verifyTeacherCourseOwnership, resourceController.deleteResource);
router.post('/:resourceId/process', verifyTeacherCourseOwnership, resourceController.processResourceNow);

module.exports = router;
