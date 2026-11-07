const pool = require('../config/database');

class NodeTypeModel {
  /**
   * Listar todos los tipos de nodos activos con filtro opcional de categoría
   */
  static async findAll({ category = null, isActive = 1 } = {}) {
    const conditions = ['is_active = ?'];
    const params = [isActive ? 1 : 0];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT id, category, name, slug, description, icon_name, icon_svg,
              default_color, text_color, border_color, default_width, default_height,
              shape, can_be_source, can_be_target, sort_order, is_active, created_at
       FROM node_types
       ${whereClause}
       ORDER BY sort_order ASC, name ASC`,
      params
    );

    return rows;
  }

  /**
   * Obtener las categorías disponibles de tipos de nodos con su recuento
   */
  static async findCategories() {
    const [rows] = await pool.query(
      `SELECT category, COUNT(*) AS count
       FROM node_types
       WHERE is_active = 1
       GROUP BY category
       ORDER BY sort_order ASC, category ASC`
    );

    return rows;
  }

  /**
   * Obtener un tipo de nodo por su ID primario
   */
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, category, name, slug, description, icon_name, icon_svg,
              default_color, text_color, border_color, default_width, default_height,
              shape, can_be_source, can_be_target, sort_order, is_active, created_at
       FROM node_types
       WHERE id = ? LIMIT 1`,
      [id]
    );

    return rows[0] || null;
  }

  /**
   * Obtener un tipo de nodo por su slug único
   */
  static async findBySlug(slug) {
    const [rows] = await pool.query(
      `SELECT id, category, name, slug, description, icon_name, icon_svg,
              default_color, text_color, border_color, default_width, default_height,
              shape, can_be_source, can_be_target, sort_order, is_active, created_at
       FROM node_types
       WHERE slug = ? LIMIT 1`,
      [slug]
    );

    return rows[0] || null;
  }
}

module.exports = NodeTypeModel;
