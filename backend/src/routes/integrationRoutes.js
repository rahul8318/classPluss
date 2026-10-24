const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');

// Spring Boot service integration endpoints
router.get('/contract', integrationController.getIntegrationContract);
router.get('/verify-token', integrationController.verifyToken);
router.get('/courses/:courseId/verify-participant', integrationController.verifyParticipant);
router.post('/sessions/:sessionId/sync-attendance', integrationController.syncLiveSessionAttendance);

module.exports = router;
