const pool = require('../config/database');

class NodeModel {
  /**
   * Obtener todos los nodos de un embudo con detalles de su tipo de nodo
   */
  static async findByFunnelId(funnelId) {
    const [rows] = await pool.query(
      `SELECT n.id, n.funnel_id, n.node_type_id, n.label, n.sublabel,
              n.pos_x, n.pos_y, n.width, n.height, n.color, n.text_color,
              n.border_color, n.border_width, n.border_radius, n.opacity,
              n.icon_name, n.icon_url, n.notes, n.custom_data, n.z_index,
              n.is_visible, n.is_locked, n.created_at, n.updated_at,
              nt.name AS node_type_name, nt.slug AS node_type_slug,
              nt.category AS node_type_category, nt.shape AS type_shape
       FROM nodes n
       LEFT JOIN node_types nt ON n.node_type_id = nt.id
       WHERE n.funnel_id = ?
       ORDER BY n.z_index ASC, n.id ASC`,
      [funnelId]
    );

    return rows.map(node => {
      if (typeof node.custom_data === 'string') {
        try {
          node.custom_data = JSON.parse(node.custom_data);
        } catch (e) {
          // mantener como string si falla el parseo
        }
      }
      return node;
    });
  }

  /**
   * Crear un nuevo nodo en el embudo
   */
  static async create({
    funnelId,
    nodeTypeId = null,
    label,
    sublabel = null,
    posX = 100,
    posY = 100,
    width = 160,
    height = 80,
    color = '#4A90E2',
    textColor = '#FFFFFF',
    borderColor = '#2C5F8A',
    borderWidth = 2,
    borderRadius = 8,
    opacity = 1.0,
    iconName = null,
    iconUrl = null,
    notes = null,
    customData = null,
    zIndex = 1,
    isVisible = 1,
    isLocked = 0
  }) {
    const customDataStr = customData ? JSON.stringify(customData) : null;

    const [result] = await pool.query(
      `INSERT INTO nodes (
        funnel_id, node_type_id, label, sublabel, pos_x, pos_y,
        width, height, color, text_color, border_color, border_width,
        border_radius, opacity, icon_name, icon_url, notes, custom_data,
        z_index, is_visible, is_locked
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        funnelId, nodeTypeId, label, sublabel, posX, posY,
        width, height, color, textColor, borderColor, borderWidth,
        borderRadius, opacity, iconName, iconUrl, notes, customDataStr,
        zIndex, isVisible ? 1 : 0, isLocked ? 1 : 0
      ]
    );

    return await this.findById(result.insertId);
  }

  /**
   * Obtener nodo por ID
   */
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT n.*, nt.name AS node_type_name, nt.slug AS node_type_slug, nt.category AS node_type_category
       FROM nodes n
       LEFT JOIN node_types nt ON n.node_type_id = nt.id
       WHERE n.id = ? LIMIT 1`,
      [id]
    );

    if (!rows[0]) return null;
    const node = rows[0];
    if (typeof node.custom_data === 'string') {
      try {
        node.custom_data = JSON.parse(node.custom_data);
      } catch (e) {}
    }
    return node;
  }

  /**
   * Eliminar todos los nodos de un embudo
   */
  static async deleteByFunnelId(funnelId) {
    const [result] = await pool.query('DELETE FROM nodes WHERE funnel_id = ?', [funnelId]);
    return result.affectedRows;
  }
}

module.exports = NodeModel;
