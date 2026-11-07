const pool = require('../config/database');

class FunnelModel {
  /**
   * Helper para parsear canvas_state si es un string JSON
   */
  static _parseCanvasState(funnel) {
    if (!funnel) return null;
    const parsed = { ...funnel };
    if (typeof parsed.canvas_state === 'string') {
      try {
        parsed.canvas_state = JSON.parse(parsed.canvas_state);
      } catch (e) {
        // mantener string si no es JSON válido
      }
    }
    return parsed;
  }

  /**
   * Crear un nuevo embudo
   */
  static async create({
    projectId,
    name,
    description = null,
    canvasState = null,
    canvasWidth = 4000,
    canvasHeight = 3000,
    zoomLevel = 1.0,
    panX = 0,
    panY = 0,
    bgColor = '#F5F7FA',
    gridEnabled = 1,
    gridSize = 20,
    snapToGrid = 1,
    nodeCount = 0,
    connectionCount = 0,
    status = 'draft'
  }) {
    const canvasStateStr = canvasState
      ? (typeof canvasState === 'string' ? canvasState : JSON.stringify(canvasState))
      : null;

    const [result] = await pool.query(
      `INSERT INTO funnels (
        project_id, name, description, canvas_state, canvas_width, canvas_height,
        zoom_level, pan_x, pan_y, bg_color, grid_enabled, grid_size,
        snap_to_grid, node_count, connection_count, version, status, last_saved_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, NOW())`,
      [
        projectId, name, description, canvasStateStr, canvasWidth, canvasHeight,
        zoomLevel, panX, panY, bgColor, gridEnabled ? 1 : 0, gridSize,
        snapToGrid ? 1 : 0, nodeCount, connectionCount, status
      ]
    );

    return await this.findById(result.insertId);
  }

  /**
   * Obtener embudo por ID con información de su proyecto propietario
   */
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT f.*, p.user_id AS project_owner_id, p.name AS project_name, p.status AS project_status
       FROM funnels f
       JOIN projects p ON f.project_id = p.id
       WHERE f.id = ? LIMIT 1`,
      [id]
    );

    return rows[0] ? this._parseCanvasState(rows[0]) : null;
  }

  /**
   * Listar embudos pertenecientes a un proyecto
   */
  static async findByProjectId(projectId, { status = null, search = null } = {}) {
    const conditions = ['f.project_id = ?'];
    const params = [projectId];

    if (status) {
      conditions.push('f.status = ?');
      params.push(status);
    }

    if (search) {
      conditions.push('(f.name LIKE ? OR f.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [rows] = await pool.query(
      `SELECT f.id, f.project_id, f.name, f.description, f.node_count,
              f.connection_count, f.version, f.status, f.last_saved_at,
              f.created_at, f.updated_at
       FROM funnels f
       ${whereClause}
       ORDER BY f.updated_at DESC, f.id DESC`,
      params
    );

    return rows;
  }

  /**
   * Actualizar metadatos o estado de un embudo
   */
  static async update(id, fieldsToUpdate) {
    const allowedFields = [
      'name', 'description', 'status', 'canvas_state', 'canvas_width',
      'canvas_height', 'zoom_level', 'pan_x', 'pan_y', 'bg_color',
      'grid_enabled', 'grid_size', 'snap_to_grid', 'node_count',
      'connection_count', 'version'
    ];

    const fields = [];
    const values = [];

    for (const key of allowedFields) {
      if (fieldsToUpdate[key] !== undefined) {
        fields.push(`${key} = ?`);
        if (key === 'canvas_state' && typeof fieldsToUpdate[key] === 'object' && fieldsToUpdate[key] !== null) {
          values.push(JSON.stringify(fieldsToUpdate[key]));
        } else if (['grid_enabled', 'snap_to_grid'].includes(key)) {
          values.push(fieldsToUpdate[key] ? 1 : 0);
        } else {
          values.push(fieldsToUpdate[key]);
        }
      }
    }

    if (fields.length === 0) return await this.findById(id);

    // Siempre actualizar fecha de guardado
    fields.push('last_saved_at = NOW()');

    values.push(id);
    await pool.query(
      `UPDATE funnels SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findById(id);
  }

  /**
   * Eliminar un embudo por ID
   */
  static async delete(id) {
    const [result] = await pool.query('DELETE FROM funnels WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * Guardar versión en historial (snapshot)
   */
  static async saveVersion({ funnelId, version, canvasState, nodeCount = 0, savedBy = null, notes = null }) {
    const stateStr = typeof canvasState === 'string' ? canvasState : JSON.stringify(canvasState);

    const [result] = await pool.query(
      `INSERT INTO funnel_versions (
        funnel_id, version, canvas_state, node_count, saved_by, notes, saved_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        canvas_state = VALUES(canvas_state),
        node_count = VALUES(node_count),
        saved_by = VALUES(saved_by),
        notes = VALUES(notes),
        saved_at = NOW()`,
      [funnelId, version, stateStr, nodeCount, savedBy, notes]
    );

    return result.insertId;
  }
}

module.exports = FunnelModel;
