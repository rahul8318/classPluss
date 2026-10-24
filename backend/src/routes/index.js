const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const courseRoutes = require('./courseRoutes');
const moduleRoutes = require('./moduleRoutes');
const resourceRoutes = require('./resourceRoutes');
const assignmentRoutes = require('./assignmentRoutes');
const submissionRoutes = require('./submissionRoutes');
const gradeRoutes = require('./gradeRoutes');
const questionBankRoutes = require('./questionBankRoutes');
const assessmentRoutes = require('./assessmentRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const aiRoutes = require('./aiRoutes');
const notificationRoutes = require('./notificationRoutes');
const integrationRoutes = require('./integrationRoutes');

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'ClassPulse MERN Learning Workspace Backend',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// Specific API services
router.use('/auth', authRoutes);
router.use('/integration', integrationRoutes);
router.use('/notifications', notificationRoutes);

// Specific course sub-paths and direct resource routes mounted with priority
router.use('/', assignmentRoutes);
router.use('/', gradeRoutes);
router.use('/', questionBankRoutes);
router.use('/', assessmentRoutes);
router.use('/', attendanceRoutes);
router.use('/', aiRoutes);
router.use('/ai', aiRoutes);

// Base course routes and modules/resources
router.use('/courses', courseRoutes);
router.use('/courses/:courseId/modules', moduleRoutes);
router.use('/courses/:courseId/resources', resourceRoutes);
router.use('/resources', resourceRoutes);
router.use('/submissions', submissionRoutes);

module.exports = router;
