const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

// Request resubmission
router.post('/submissions/:submissionId/resubmit', authorize('teacher', 'admin'), submissionController.requestResubmission);

module.exports = router;
