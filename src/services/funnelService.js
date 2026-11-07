const pool = require('../config/database');
const FunnelModel = require('../models/funnelModel');
const ProjectModel = require('../models/projectModel');
const NodeModel = require('../models/nodeModel');
const ConnectionModel = require('../models/connectionModel');

class FunnelService {
  /**
   * Verificar acceso al proyecto padre
   */
  static async _checkProjectAccess(projectId, userId, role) {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      const error = new Error(`Proyecto con ID ${projectId} no encontrado`);
      error.statusCode = 404;
      error.code = 'PROJECT_NOT_FOUND';
      throw error;
    }

    if (role !== 'admin' && project.user_id !== userId) {
      const error = new Error('No tienes permiso para acceder a los recursos de este proyecto');
      error.statusCode = 403;
      error.code = 'PROJECT_ACCESS_DENIED';
      throw error;
    }

    return project;
  }

  /**
   * Verificar acceso a un embudo específico
   */
  static async _checkFunnelAccess(funnelId, userId, role) {
    const funnel = await FunnelModel.findById(funnelId);
    if (!funnel) {
      const error = new Error(`Embudo con ID ${funnelId} no encontrado`);
      error.statusCode = 404;
      error.code = 'FUNNEL_NOT_FOUND';
      throw error;
    }

    if (role !== 'admin' && funnel.project_owner_id !== userId) {
      const error = new Error('No tienes permiso para operar sobre este embudo');
      error.statusCode = 403;
      error.code = 'FUNNEL_ACCESS_DENIED';
      throw error;
    }

    return funnel;
  }

  /**
   * Listar todos los embudos de un proyecto
   */
  static async getProjectFunnels({ projectId, userId, role, status = null, search = null }) {
    await this._checkProjectAccess(projectId, userId, role);
    return await FunnelModel.findByProjectId(projectId, { status, search });
  }

  /**
   * Crear un nuevo embudo en blanco
   */
  static async createFunnel({
    projectId,
    name,
    description = null,
    userId,
    role,
    bgColor = '#F5F7FA',
    canvasWidth = 4000,
    canvasHeight = 3000
  }) {
    if (!name || name.trim().length < 2) {
      const error = new Error('El nombre del embudo debe tener al menos 2 caracteres');
      error.statusCode = 422;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    await this._checkProjectAccess(projectId, userId, role);

    const initialCanvasState = {
      nodes: [],
      connections: [],
      viewport: { zoom: 1.0, x: 0, y: 0 }
    };

    const funnel = await FunnelModel.create({
      projectId,
      name: name.trim(),
      description,
      canvasState: initialCanvasState,
      canvasWidth,
      canvasHeight,
      bgColor,
      nodeCount: 0,
      connectionCount: 0,
      status: 'draft'
    });

    // Actualizar recuento de embudos del proyecto
    await pool.query('UPDATE projects SET funnel_count = funnel_count + 1 WHERE id = ?', [projectId]);

    return funnel;
  }

  /**
   * Obtener detalle completo de un embudo (incluyendo nodos y conexiones)
   */
  static async getFunnelWithDetails({ id, userId, role }) {
    const funnel = await this._checkFunnelAccess(id, userId, role);

    const nodes = await NodeModel.findByFunnelId(id);
    const connections = await ConnectionModel.findByFunnelId(id);

    return {
      ...funnel,
      nodes,
      connections
    };
  }

  /**
   * Actualizar metadatos o estado de un embudo
   */
  static async updateFunnel({
    id,
    userId,
    role,
    name,
    description,
    status,
    canvasState,
    canvasWidth,
    canvasHeight,
    zoomLevel,
    panX,
    panY,
    bgColor,
    gridEnabled,
    gridSize,
    snapToGrid,
    nodeCount,
    connectionCount
  }) {
    const funnel = await this._checkFunnelAccess(id, userId, role);

    const updateFields = {};

    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        const error = new Error('El nombre del embudo debe tener al menos 2 caracteres');
        error.statusCode = 422;
        error.code = 'VALIDATION_ERROR';
        throw error;
      }
      updateFields.name = name.trim();
    }

    if (description !== undefined) updateFields.description = description;
    if (status !== undefined) updateFields.status = status;
    if (canvasWidth !== undefined) updateFields.canvas_width = canvasWidth;
    if (canvasHeight !== undefined) updateFields.canvas_height = canvasHeight;
    if (zoomLevel !== undefined) updateFields.zoom_level = zoomLevel;
    if (panX !== undefined) updateFields.pan_x = panX;
    if (panY !== undefined) updateFields.pan_y = panY;
    if (bgColor !== undefined) updateFields.bg_color = bgColor;
    if (gridEnabled !== undefined) updateFields.grid_enabled = gridEnabled;
    if (gridSize !== undefined) updateFields.grid_size = gridSize;
    if (snapToGrid !== undefined) updateFields.snap_to_grid = snapToGrid;
    if (nodeCount !== undefined) updateFields.node_count = nodeCount;
    if (connectionCount !== undefined) updateFields.connection_count = connectionCount;

    // Si se envía un nuevo estado del canvas, versionar e incrementar
    if (canvasState !== undefined) {
      updateFields.canvas_state = canvasState;
      const nextVersion = funnel.version + 1;
      updateFields.version = nextVersion;

      await FunnelModel.saveVersion({
        funnelId: id,
        version: nextVersion,
        canvasState,
        nodeCount: nodeCount !== undefined ? nodeCount : funnel.node_count,
        savedBy: userId,
        notes: 'Guardado automático de canvas'
      });
    }

    return await FunnelModel.update(id, updateFields);
  }

  /**
   * Duplicar un embudo completo con todos sus nodos y conexiones
   */
  static async duplicateFunnel({ id, userId, role, newName = null }) {
    const funnel = await this._checkFunnelAccess(id, userId, role);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const duplicatedName = newName ? newName.trim() : `${funnel.name} (Copia)`;
      const canvasStateStr = funnel.canvas_state
        ? (typeof funnel.canvas_state === 'string' ? funnel.canvas_state : JSON.stringify(funnel.canvas_state))
        : null;

      // 1. Crear nuevo embudo clonado
      const [newFunnelResult] = await connection.query(
        `INSERT INTO funnels (
          project_id, name, description, canvas_state, canvas_width, canvas_height,
          zoom_level, pan_x, pan_y, bg_color, grid_enabled, grid_size,
          snap_to_grid, node_count, connection_count, version, status, last_saved_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'draft', NOW())`,
        [
          funnel.project_id, duplicatedName, funnel.description, canvasStateStr,
          funnel.canvas_width, funnel.canvas_height, funnel.zoom_level, funnel.pan_x,
          funnel.pan_y, funnel.bg_color, funnel.grid_enabled, funnel.grid_size,
          funnel.snap_to_grid, funnel.node_count, funnel.connection_count
        ]
      );

      const newFunnelId = newFunnelResult.insertId;

      // 2. Clonar nodos y mapear sus IDs antiguos -> nuevos
      const [originalNodes] = await connection.query('SELECT * FROM nodes WHERE funnel_id = ?', [id]);
      const oldIdToNewId = {};

      for (const node of originalNodes) {
        const [insertedNode] = await connection.query(
          `INSERT INTO nodes (
            funnel_id, node_type_id, label, sublabel, pos_x, pos_y,
            width, height, color, text_color, border_color, border_width,
            border_radius, opacity, icon_name, icon_url, notes, custom_data,
            z_index, is_visible, is_locked
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newFunnelId, node.node_type_id, node.label, node.sublabel,
            node.pos_x, node.pos_y, node.width, node.height, node.color,
            node.text_color, node.border_color, node.border_width,
            node.border_radius, node.opacity, node.icon_name, node.icon_url,
            node.notes, node.custom_data, node.z_index, node.is_visible, node.is_locked
          ]
        );

        oldIdToNewId[node.id] = insertedNode.insertId;
      }

      // 3. Clonar conexiones vinculando los nuevos IDs de nodos
      const [originalConnections] = await connection.query('SELECT * FROM connections WHERE funnel_id = ?', [id]);

      for (const conn of originalConnections) {
        const newSourceId = oldIdToNewId[conn.source_node_id];
        const newTargetId = oldIdToNewId[conn.target_node_id];

        if (newSourceId && newTargetId) {
          await connection.query(
            `INSERT INTO connections (
              funnel_id, source_node_id, target_node_id, label, label_pos,
              line_style, line_width, arrow_style, color, curve_type,
              source_anchor, target_anchor, control_point_x, control_point_y,
              animated, is_visible
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newFunnelId, newSourceId, newTargetId, conn.label, conn.label_pos,
              conn.line_style, conn.line_width, conn.arrow_style, conn.color,
              conn.curve_type, conn.source_anchor, conn.target_anchor,
              conn.control_point_x, conn.control_point_y, conn.animated, conn.is_visible
            ]
          );
        }
      }

      // 4. Incrementar contador de embudos en el proyecto
      await connection.query('UPDATE projects SET funnel_count = funnel_count + 1 WHERE id = ?', [funnel.project_id]);

      await connection.commit();

      return await FunnelModel.findById(newFunnelId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar un embudo y todos sus datos en cascada
   */
  static async deleteFunnel({ id, userId, role }) {
    const funnel = await this._checkFunnelAccess(id, userId, role);

    await FunnelModel.delete(id);

    // Decrementar contador del proyecto
    await pool.query('UPDATE projects SET funnel_count = GREATEST(0, funnel_count - 1) WHERE id = ?', [funnel.project_id]);

    return {
      success: true,
      id,
      message: 'Embudo y todos sus elementos asociados eliminados exitosamente'
    };
  }

  /**
   * POST /api/funnels/:id/canvas
   * Guardar el estado completo del canvas y crear snapshot en el historial
   */
  static async saveCanvasState({ id, userId, role, canvasState, notes }) {
    const funnel = await this._checkFunnelAccess(id, userId, role);

    if (!canvasState) {
      const error = new Error('El estado del canvas (canvasState) es requerido');
      error.statusCode = 422;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    const nextVersion = (funnel.version || 1) + 1;
    const nodeCount = Array.isArray(canvasState.nodes) ? canvasState.nodes.length : funnel.node_count;
    const connectionCount = Array.isArray(canvasState.connections) ? canvasState.connections.length : funnel.connection_count;
    const zoomLevel = canvasState.viewport ? canvasState.viewport.zoomLevel || 1.0 : funnel.zoom_level;
    const panX = canvasState.viewport ? canvasState.viewport.panX || 0 : funnel.pan_x;
    const panY = canvasState.viewport ? canvasState.viewport.panY || 0 : funnel.pan_y;

    await FunnelModel.saveVersion({
      funnelId: id,
      version: nextVersion,
      canvasState,
      nodeCount,
      savedBy: userId,
      notes: notes || 'Guardado automático de lienzo'
    });

    const updated = await FunnelModel.update(id, {
      canvas_state: canvasState,
      node_count: nodeCount,
      connection_count: connectionCount,
      zoom_level: zoomLevel,
      pan_x: panX,
      pan_y: panY,
      version: nextVersion
    });

    return {
      funnelId: id,
      version: nextVersion,
      lastSavedAt: updated.last_saved_at,
      canvasState: updated.canvas_state
    };
  }

  /**
   * GET /api/funnels/:id/canvas
   * Obtener el estado del canvas guardado para el editor
   */
  static async getCanvasState({ id, userId, role }) {
    const funnel = await this._checkFunnelAccess(id, userId, role);
    return {
      funnelId: funnel.id,
      name: funnel.name,
      version: funnel.version,
      lastSavedAt: funnel.last_saved_at,
      canvasState: funnel.canvas_state || {
        version: '1.0',
        viewport: { zoomLevel: funnel.zoom_level || 1, panX: funnel.pan_x || 0, panY: funnel.pan_y || 0 },
        settings: { gridEnabled: !!funnel.grid_enabled, gridSize: funnel.grid_size || 20, snapToGrid: !!funnel.snap_to_grid, bgColor: funnel.bg_color || '#F8FAFC' },
        nodes: [],
        connections: []
      }
    };
  }

  /**
   * GET /api/funnels/:id/versions
   * Listar historial de versiones guardadas
   */
  static async getVersions({ id, userId, role }) {
    await this._checkFunnelAccess(id, userId, role);
    const [rows] = await pool.query(
      `SELECT v.id, v.funnel_id, v.version, v.node_count, v.saved_by, v.saved_at, v.notes,
              u.name AS saved_by_name
       FROM funnel_versions v
       LEFT JOIN users u ON v.saved_by = u.id
       WHERE v.funnel_id = ?
       ORDER BY v.version DESC`,
      [id]
    );
    return rows;
  }

  /**
   * POST /api/funnels/:id/restore/:version
   * Restaurar una versión específica desde el historial
   */
  static async restoreVersion({ id, userId, role, version }) {
    const funnel = await this._checkFunnelAccess(id, userId, role);
    const [rows] = await pool.query(
      `SELECT * FROM funnel_versions WHERE funnel_id = ? AND version = ? LIMIT 1`,
      [id, version]
    );
    if (!rows[0]) {
      const error = new Error(`Versión ${version} no encontrada para este embudo`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const versionSnapshot = rows[0];
    let state = versionSnapshot.canvas_state;
    if (typeof state === 'string') {
      try { state = JSON.parse(state); } catch (e) {}
    }

    const nextVersion = (funnel.version || 1) + 1;
    await FunnelModel.saveVersion({
      funnelId: id,
      version: nextVersion,
      canvasState: state,
      nodeCount: versionSnapshot.node_count,
      savedBy: userId,
      notes: `Restaurado desde versión ${version}`
    });

    const updated = await FunnelModel.update(id, {
      canvas_state: state,
      node_count: versionSnapshot.node_count,
      version: nextVersion
    });

    return {
      funnelId: id,
      restoredFromVersion: version,
      newVersion: nextVersion,
      canvasState: updated.canvas_state,
      lastSavedAt: updated.last_saved_at
    };
  }
}

module.exports = FunnelService;
