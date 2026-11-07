const pool = require('../config/database');

class TemplateModel {
  /**
   * Helper para asegurar que canvas_data y tags sean objetos/arrays parseados
   */
  static _parseJsonFields(template) {
    if (!template) return null;
    const parsed = { ...template };

    if (typeof parsed.canvas_data === 'string') {
      try {
        parsed.canvas_data = JSON.parse(parsed.canvas_data);
      } catch (e) {
        // mantener string si falla el parseo
      }
    }

    if (typeof parsed.tags === 'string') {
      try {
        parsed.tags = JSON.parse(parsed.tags);
      } catch (e) {
        // mantener string si falla el parseo
      }
    }

    return parsed;
  }

  /**
   * Listar plantillas públicas con filtros y paginación
   */
  static async findPublic({ page = 1, limit = 10, category = null, search = null, isFeatured = null } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const conditions = ['t.is_public = 1'];
    const params = [];

    if (category) {
      conditions.push('t.category = ?');
      params.push(category);
    }

    if (isFeatured !== null && isFeatured !== undefined) {
      conditions.push('t.is_featured = ?');
      params.push(isFeatured ? 1 : 0);
    }

    if (search) {
      conditions.push('(t.name LIKE ? OR t.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Contar total de registros
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM templates t ${whereClause}`,
      params
    );
    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limitNum) || 1;

    // Obtener plantillas
    const queryParams = [...params, limitNum, offset];
    const [rows] = await pool.query(
      `SELECT t.id, t.name, t.slug, t.category, t.description, t.thumbnail, t.preview_img,
              t.canvas_data, t.node_count, t.is_public, t.is_featured, t.downloads, t.rating,
              t.tags, t.created_at, t.updated_at, u.name AS author_name
       FROM templates t
       LEFT JOIN users u ON t.created_by = u.id
       ${whereClause}
       ORDER BY t.is_featured DESC, t.downloads DESC, t.id ASC
       LIMIT ? OFFSET ?`,
      queryParams
    );

    return {
      items: rows.map(this._parseJsonFields),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    };
  }

  /**
   * Listar plantillas destacadas
   */
  static async findFeatured({ limit = 6 } = {}) {
    const limitNum = Math.min(20, Math.max(1, parseInt(limit, 10) || 6));
    const [rows] = await pool.query(
      `SELECT t.id, t.name, t.slug, t.category, t.description, t.thumbnail, t.preview_img,
              t.canvas_data, t.node_count, t.is_public, t.is_featured, t.downloads, t.rating,
              t.tags, t.created_at, t.updated_at, u.name AS author_name
       FROM templates t
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.is_public = 1 AND t.is_featured = 1
       ORDER BY t.downloads DESC, t.rating DESC
       LIMIT ?`,
      [limitNum]
    );

    return rows.map(this._parseJsonFields);
  }

  /**
   * Obtener plantilla por ID
   */
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT t.id, t.name, t.slug, t.category, t.description, t.thumbnail, t.preview_img,
              t.canvas_data, t.node_count, t.is_public, t.is_featured, t.downloads, t.rating,
              t.tags, t.created_at, t.updated_at, u.name AS author_name
       FROM templates t
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.id = ? LIMIT 1`,
      [id]
    );

    return rows[0] ? this._parseJsonFields(rows[0]) : null;
  }

  /**
   * Obtener plantilla por slug
   */
  static async findBySlug(slug) {
    const [rows] = await pool.query(
      `SELECT t.id, t.name, t.slug, t.category, t.description, t.thumbnail, t.preview_img,
              t.canvas_data, t.node_count, t.is_public, t.is_featured, t.downloads, t.rating,
              t.tags, t.created_at, t.updated_at, u.name AS author_name
       FROM templates t
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.slug = ? LIMIT 1`,
      [slug]
    );

    return rows[0] ? this._parseJsonFields(rows[0]) : null;
  }

  /**
   * Incrementar contador de descargas / usos
   */
  static async incrementDownloads(id) {
    await pool.query('UPDATE templates SET downloads = downloads + 1 WHERE id = ?', [id]);
  }
}

module.exports = TemplateModel;
