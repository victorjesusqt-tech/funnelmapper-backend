const TemplateModel = require('../models/templateModel');
const ProjectModel = require('../models/projectModel');
const pool = require('../config/database');

class TemplateController {
  /**
   * GET /api/templates
   * Listar plantillas públicas paginadas con filtros opcionales (?category=..., ?search=...)
   */
  static async list(req, res, next) {
    try {
      const { page, limit, category, search, featured } = req.query;
      const isFeatured = featured !== undefined ? featured === 'true' || featured === '1' : null;

      const result = await TemplateModel.findPublic({
        page,
        limit,
        category,
        search,
        isFeatured
      });

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Plantillas obtenidas exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/templates/featured
   * Listar plantillas destacadas
   */
  static async getFeatured(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 6;
      const featuredTemplates = await TemplateModel.findFeatured({ limit });

      return res.status(200).json({
        success: true,
        data: featuredTemplates,
        count: featuredTemplates.length,
        message: 'Plantillas destacadas obtenidas exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/templates/category/:cat
   * Filtrar plantillas por categoría
   */
  static async getByCategory(req, res, next) {
    try {
      const { cat } = req.params;
      const { page, limit, search } = req.query;

      const result = await TemplateModel.findPublic({
        page,
        limit,
        category: cat,
        search
      });

      return res.status(200).json({
        success: true,
        data: result,
        category: cat,
        message: `Plantillas de categoría '${cat}' obtenidas exitosamente`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/templates/:id
   * Obtener detalle completo de una plantilla por ID
   */
  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        const error = new Error('El ID de la plantilla debe ser un número entero');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const template = await TemplateModel.findById(id);
      if (!template) {
        const error = new Error(`Plantilla con ID ${id} no encontrada`);
        error.statusCode = 404;
        error.code = 'TEMPLATE_NOT_FOUND';
        throw error;
      }

      return res.status(200).json({
        success: true,
        data: template,
        message: 'Plantilla obtenida exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/templates/:id/use
   * Crear un nuevo embudo dentro de un proyecto a partir de la plantilla seleccionada
   */
  static async useTemplate(req, res, next) {
    const connection = await pool.getConnection();
    try {
      const templateId = parseInt(req.params.id, 10);
      const { projectId, name } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      if (!projectId) {
        const error = new Error('El ID del proyecto (projectId) es requerido');
        error.statusCode = 422;
        error.code = 'VALIDATION_ERROR';
        throw error;
      }

      // 1. Validar existencia y permisos sobre el proyecto
      const project = await ProjectModel.findById(projectId);
      if (!project) {
        const error = new Error(`Proyecto con ID ${projectId} no encontrado`);
        error.statusCode = 404;
        error.code = 'PROJECT_NOT_FOUND';
        throw error;
      }

      if (userRole !== 'admin' && project.user_id !== userId) {
        const error = new Error('No tienes permiso para agregar embudos a este proyecto');
        error.statusCode = 403;
        error.code = 'PROJECT_ACCESS_DENIED';
        throw error;
      }

      // 2. Obtener la plantilla
      const template = await TemplateModel.findById(templateId);
      if (!template) {
        const error = new Error(`Plantilla con ID ${templateId} no encontrada`);
        error.statusCode = 404;
        error.code = 'TEMPLATE_NOT_FOUND';
        throw error;
      }

      await connection.beginTransaction();

      const funnelName = name ? name.trim() : template.name;
      const canvasStateStr = typeof template.canvas_data === 'string'
        ? template.canvas_data
        : JSON.stringify(template.canvas_data);

      const canvasData = typeof template.canvas_data === 'string'
        ? JSON.parse(template.canvas_data)
        : template.canvas_data;

      const nodesList = canvasData?.nodes || [];
      const connectionsList = canvasData?.connections || [];

      // 3. Insertar nuevo embudo en tabla funnels
      const [funnelResult] = await connection.query(
        `INSERT INTO funnels (
          project_id, name, description, canvas_state, node_count,
          connection_count, status, last_saved_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'draft', NOW())`,
        [
          projectId,
          funnelName,
          template.description,
          canvasStateStr,
          nodesList.length,
          connectionsList.length
        ]
      );

      const funnelId = funnelResult.insertId;

      // 4. Mapear e insertar nodos en la tabla `nodes`
      const tempIdToDbId = {};

      if (nodesList.length > 0) {
        // Pre-cargar tipos de nodos para mapear slug a ID
        const [nodeTypes] = await connection.query('SELECT id, slug, default_color, border_color, shape FROM node_types');
        const nodeTypeMap = {};
        nodeTypes.forEach(nt => { nodeTypeMap[nt.slug] = nt; });

        for (const n of nodesList) {
          const typeInfo = nodeTypeMap[n.node_type_slug] || null;
          const nodeTypeId = typeInfo ? typeInfo.id : null;
          const label = n.label || (typeInfo ? typeInfo.name : 'Nodo');
          const posX = n.pos_x !== undefined ? n.pos_x : 100;
          const posY = n.pos_y !== undefined ? n.pos_y : 100;
          const color = typeInfo ? typeInfo.default_color : '#4A90E2';
          const borderColor = typeInfo ? typeInfo.border_color : '#2C5F8A';

          const [nodeRes] = await connection.query(
            `INSERT INTO nodes (
              funnel_id, node_type_id, label, pos_x, pos_y, color, border_color
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [funnelId, nodeTypeId, label, posX, posY, color, borderColor]
          );

          if (n.tempId) {
            tempIdToDbId[n.tempId] = nodeRes.insertId;
          }
        }
      }

      // 5. Insertar conexiones en la tabla `connections`
      if (connectionsList.length > 0) {
        for (const c of connectionsList) {
          const sourceDbId = tempIdToDbId[c.source];
          const targetDbId = tempIdToDbId[c.target];

          if (sourceDbId && targetDbId) {
            await connection.query(
              `INSERT IGNORE INTO connections (
                funnel_id, source_node_id, target_node_id, label
              ) VALUES (?, ?, ?, ?)`,
              [funnelId, sourceDbId, targetDbId, c.label || null]
            );
          }
        }
      }

      // 6. Actualizar contador de embudos del proyecto
      await connection.query(
        'UPDATE projects SET funnel_count = funnel_count + 1 WHERE id = ?',
        [projectId]
      );

      // 7. Incrementar descargas de la plantilla
      await connection.query(
        'UPDATE templates SET downloads = downloads + 1 WHERE id = ?',
        [templateId]
      );

      await connection.commit();

      // 8. Recuperar el embudo creado
      const [funnelRows] = await pool.query(
        'SELECT * FROM funnels WHERE id = ? LIMIT 1',
        [funnelId]
      );

      return res.status(201).json({
        success: true,
        data: funnelRows[0],
        message: 'Embudo creado exitosamente a partir de la plantilla',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      await connection.rollback();
      next(error);
    } finally {
      connection.release();
    }
  }
}

module.exports = TemplateController;
