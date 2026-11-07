const pool = require('../config/database');
const logger = require('../utils/logger');

class ActivityLogModel {
  /**
   * Registrar evento en activity_logs
   */
  static async log({ userId = null, projectId = null, action, entityType = null, entityId = null, details = null, ipAddress = null, userAgent = null }) {
    try {
      await pool.query(
        'INSERT INTO activity_logs (user_id, project_id, action, entity_type, entity_id, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          userId,
          projectId,
          action,
          entityType,
          entityId,
          details ? JSON.stringify(details) : null,
          ipAddress,
          userAgent
        ]
      );
    } catch (err) {
      // Los fallos en logs de auditoría no deben romper la petición principal
      logger.error('Error al registrar en activity_logs: %o', err);
    }
  }
}

module.exports = ActivityLogModel;
