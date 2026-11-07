const pool = require('../config/database');

/**
 * Modelo de datos para la gestión y auditoría de exportaciones en MySQL/MariaDB.
 */
class ExportModel {
  /**
   * Crea un registro de exportación.
   */
  static async create({ funnelId, userId, format, status = 'pending' }) {
    const [result] = await pool.query(
      `INSERT INTO exports (funnel_id, user_id, format, status)
       VALUES (?, ?, ?, ?)`,
      [funnelId, userId, format, status]
    );

    return await this.findById(result.insertId);
  }

  /**
   * Obtiene un registro de exportación por su ID.
   */
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT e.*, f.name AS funnel_name, u.name AS user_name, u.email AS user_email
       FROM exports e
       JOIN funnels f ON e.funnel_id = f.id
       JOIN users u ON e.user_id = u.id
       WHERE e.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Obtiene el historial de exportaciones de un embudo.
   */
  static async findByFunnelId(funnelId, limit = 50) {
    const [rows] = await pool.query(
      `SELECT e.*, u.name AS user_name
       FROM exports e
       JOIN users u ON e.user_id = u.id
       WHERE e.funnel_id = ?
       ORDER BY e.created_at DESC
       LIMIT ?`,
      [funnelId, limit]
    );
    return rows;
  }

  /**
   * Actualiza el estado y metadatos de una exportación.
   */
  static async update(id, { status, filePath, fileSize, errorMsg, completedAt }) {
    const fields = [];
    const values = [];

    if (status !== undefined) {
      fields.push('status = ?');
      values.push(status);
    }
    if (filePath !== undefined) {
      fields.push('file_path = ?');
      values.push(filePath);
    }
    if (fileSize !== undefined) {
      fields.push('file_size = ?');
      values.push(fileSize);
    }
    if (errorMsg !== undefined) {
      fields.push('error_msg = ?');
      values.push(errorMsg ? String(errorMsg).substring(0, 300) : null);
    }
    if (completedAt !== undefined) {
      fields.push('completed_at = ?');
      values.push(completedAt);
    }

    if (fields.length === 0) return await this.findById(id);

    values.push(id);
    await pool.query(`UPDATE exports SET ${fields.join(', ')} WHERE id = ?`, values);
    return await this.findById(id);
  }

  /**
   * Elimina un registro de exportación.
   */
  static async delete(id) {
    const [result] = await pool.query('DELETE FROM exports WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * Obtiene y elimina exportaciones con más de N horas para limpieza automática.
   */
  static async getOldExports(hoursOld = 1) {
    const [rows] = await pool.query(
      `SELECT * FROM exports
       WHERE created_at < NOW() - INTERVAL ? HOUR`,
      [hoursOld]
    );
    return rows;
  }
}

module.exports = ExportModel;

