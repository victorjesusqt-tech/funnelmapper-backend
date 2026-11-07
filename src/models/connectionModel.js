const pool = require('../config/database');

class ConnectionModel {
  /**
   * Obtener todas las conexiones de un embudo
   */
  static async findByFunnelId(funnelId) {
    const [rows] = await pool.query(
      `SELECT c.id, c.funnel_id, c.source_node_id, c.target_node_id,
              c.label, c.label_pos, c.line_style, c.line_width, c.arrow_style,
              c.color, c.curve_type, c.source_anchor, c.target_anchor,
              c.control_point_x, c.control_point_y, c.animated, c.is_visible,
              c.created_at, c.updated_at
       FROM connections c
       WHERE c.funnel_id = ?
       ORDER BY c.id ASC`,
      [funnelId]
    );

    return rows;
  }

  /**
   * Crear una conexión entre dos nodos
   */
  static async create({
    funnelId,
    sourceNodeId,
    targetNodeId,
    label = null,
    labelPos = 0.5,
    lineStyle = 'solid',
    lineWidth = 2,
    arrowStyle = 'arrow',
    color = '#94A3B8',
    curveType = 'bezier',
    sourceAnchor = 'auto',
    targetAnchor = 'auto',
    controlPointX = null,
    controlPointY = null,
    animated = 0,
    isVisible = 1
  }) {
    const [result] = await pool.query(
      `INSERT INTO connections (
        funnel_id, source_node_id, target_node_id, label, label_pos,
        line_style, line_width, arrow_style, color, curve_type,
        source_anchor, target_anchor, control_point_x, control_point_y,
        animated, is_visible
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        funnelId, sourceNodeId, targetNodeId, label, labelPos,
        lineStyle, lineWidth, arrowStyle, color, curveType,
        sourceAnchor, targetAnchor, controlPointX, controlPointY,
        animated ? 1 : 0, isVisible ? 1 : 0
      ]
    );

    return await this.findById(result.insertId);
  }

  /**
   * Obtener conexión por ID
   */
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM connections WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Eliminar conexiones de un embudo
   */
  static async deleteByFunnelId(funnelId) {
    const [result] = await pool.query('DELETE FROM connections WHERE funnel_id = ?', [funnelId]);
    return result.affectedRows;
  }
}

module.exports = ConnectionModel;
