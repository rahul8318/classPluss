const AuditEvent = require('../models/AuditEvent');
const logger = require('../utils/logger');

class AuditService {
  /**
   * Log an audit trail event
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.action - e.g. 'ATTENDANCE_OVERRIDE', 'GRADE_SUBMITTED', 'ASSESSMENT_CREATED'
   * @param {string} params.entityType - 'Course' | 'AttendanceRecord' | 'GradeFeedback' | 'Assignment'
   * @param {string} params.entityId
   * @param {object} params.details
   * @param {string} params.ipAddress
   */
  static async log({ userId, action, entityType, entityId, details = {}, ipAddress = '' }) {
    try {
      await AuditEvent.create({
        userId,
        action,
        entityType,
        entityId: String(entityId),
        details,
        ipAddress,
      });
    } catch (err) {
      logger.error('Failed to record audit event:', err);
    }
  }
}

module.exports = AuditService;
