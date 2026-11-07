const pool = require('../config/database');

class ProjectModel {
  /**
   * Crear un nuevo proyecto
   */
  static async create({ userId, name, description = null, color = '#4A90E2', isPublic = 0, status = 'draft', thumbnail = null }) {
    const [result] = await pool.query(
      `INSERT INTO projects (user_id, name, description, color, is_public, status, thumbnail, funnel_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [userId, name, description, color, isPublic ? 1 : 0, status, thumbnail]
    );

    return await this.findById(result.insertId);
  }

  /**
   * Obtener proyecto por ID
   */
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT p.id, p.user_id, p.name, p.description, p.thumbnail, p.color, p.is_public, p.status, p.funnel_count,
              p.created_at, p.updated_at, u.name AS owner_name, u.email AS owner_email
       FROM projects p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Listar proyectos del usuario con paginación y filtros
   */
  static async findUserProjects({ userId, isAdmin = false, page = 1, limit = 20, status = null, search = null }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    // Si no es admin, solo ve sus propios proyectos
    if (!isAdmin) {
      conditions.push('p.user_id = ?');
      params.push(userId);
    }

    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }

    if (search) {
      conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Contar total
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM projects p ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    // Obtener registros paginados
    const queryParams = [...params, limit, offset];
    const [rows] = await pool.query(
      `SELECT p.id, p.user_id, p.name, p.description, p.thumbnail, p.color, p.is_public, p.status, p.funnel_count,
              p.created_at, p.updated_at
       FROM projects p
       ${whereClause}
       ORDER BY p.updated_at DESC
       LIMIT ? OFFSET ?`,
      queryParams
    );

    return {
      items: rows,
      total
    };
  }

  /**
   * Actualizar un proyecto
   */
  static async update(id, fieldsToUpdate) {
    const allowedFields = ['name', 'description', 'thumbnail', 'color', 'is_public', 'status'];
    const fields = [];
    const values = [];

    for (const key of allowedFields) {
      if (fieldsToUpdate[key] !== undefined) {
        fields.push(`${key} = ?`);
        if (key === 'is_public') {
          values.push(fieldsToUpdate[key] ? 1 : 0);
        } else {
          values.push(fieldsToUpdate[key]);
        }
      }
    }

    if (fields.length === 0) return await this.findById(id);

    values.push(id);
    await pool.query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findById(id);
  }

  /**
   * Eliminar un proyecto
   */
  static async delete(id) {
    const [result] = await pool.query('DELETE FROM projects WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * Cambiar estado de archivado
   */
  static async toggleArchive(id, newStatus) {
    await pool.query('UPDATE projects SET status = ? WHERE id = ?', [newStatus, id]);
    return await this.findById(id);
  }

  /**
   * Obtener estadísticas rápidas
   */
  static async getStats(id) {
    const [rows] = await pool.query(
      `SELECT id, name, status, funnel_count, created_at, updated_at
       FROM projects
       WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }
}

module.exports = ProjectModel;
