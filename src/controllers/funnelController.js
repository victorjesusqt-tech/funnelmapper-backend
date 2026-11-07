const FunnelService = require('../services/funnelService');

class FunnelController {
  /**
   * GET /api/funnels/project/:projectId
   * Listar embudos pertenecientes a un proyecto
   */
  static async listByProject(req, res, next) {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      if (isNaN(projectId)) {
        const error = new Error('El ID del proyecto debe ser un número entero válido');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const { status, search } = req.query;
      const funnels = await FunnelService.getProjectFunnels({
        projectId,
        userId: req.user.id,
        role: req.user.role,
        status,
        search
      });

      return res.status(200).json({
        success: true,
        data: funnels,
        count: funnels.length,
        message: 'Embudos del proyecto obtenidos exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/funnels
   * Crear nuevo embudo en blanco
   */
  static async create(req, res, next) {
    try {
      const { projectId, name, description, bgColor, canvasWidth, canvasHeight } = req.body;

      if (!projectId) {
        const error = new Error('El ID del proyecto (projectId) es requerido');
        error.statusCode = 422;
        error.code = 'VALIDATION_ERROR';
        throw error;
      }

      const funnel = await FunnelService.createFunnel({
        projectId: parseInt(projectId, 10),
        name,
        description,
        userId: req.user.id,
        role: req.user.role,
        bgColor,
        canvasWidth,
        canvasHeight
      });

      return res.status(201).json({
        success: true,
        data: funnel,
        message: 'Embudo creado exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/funnels/:id
   * Obtener detalle de embudo con sus nodos y conexiones
   */
  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        const error = new Error('El ID del embudo debe ser un número entero');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const funnel = await FunnelService.getFunnelWithDetails({
        id,
        userId: req.user.id,
        role: req.user.role
      });

      return res.status(200).json({
        success: true,
        data: funnel,
        message: 'Embudo obtenido exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/funnels/:id
   * Actualizar datos o canvas de un embudo
   */
  static async update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        const error = new Error('El ID del embudo debe ser un número entero');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const updated = await FunnelService.updateFunnel({
        id,
        userId: req.user.id,
        role: req.user.role,
        ...req.body
      });

      return res.status(200).json({
        success: true,
        data: updated,
        message: 'Embudo actualizado exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/funnels/:id
   * Eliminar embudo y sus elementos en cascada
   */
  static async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        const error = new Error('El ID del embudo debe ser un número entero');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const result = await FunnelService.deleteFunnel({
        id,
        userId: req.user.id,
        role: req.user.role
      });

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Embudo eliminado exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/funnels/:id/duplicate
   * Duplicar un embudo completo con sus nodos y conexiones
   */
  static async duplicate(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        const error = new Error('El ID del embudo debe ser un número entero');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const duplicated = await FunnelService.duplicateFunnel({
        id,
        userId: req.user.id,
        role: req.user.role,
        newName: req.body ? req.body.name : null
      });

      return res.status(201).json({
        success: true,
        data: duplicated,
        message: 'Embudo duplicado exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/funnels/:id/canvas
   * Guardar estado completo del canvas
   */
  static async saveCanvas(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        const error = new Error('El ID del embudo debe ser un número entero');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const result = await FunnelService.saveCanvasState({
        id,
        userId: req.user.id,
        role: req.user.role,
        canvasState: req.body.canvasState || req.body.canvas_state,
        notes: req.body.notes
      });

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Estado del canvas guardado exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/funnels/:id/canvas
   * Obtener estado del canvas para el editor
   */
  static async getCanvas(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        const error = new Error('El ID del embudo debe ser un número entero');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const result = await FunnelService.getCanvasState({
        id,
        userId: req.user.id,
        role: req.user.role
      });

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Estado del canvas obtenido exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/funnels/:id/versions
   * Listar historial de versiones del canvas
   */
  static async getVersions(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        const error = new Error('El ID del embudo debe ser un número entero');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const versions = await FunnelService.getVersions({
        id,
        userId: req.user.id,
        role: req.user.role
      });

      return res.status(200).json({
        success: true,
        data: versions,
        count: versions.length,
        message: 'Historial de versiones obtenido exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/funnels/:id/restore/:version
   * Restaurar versión de canvas
   */
  static async restoreVersion(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const version = parseInt(req.params.version, 10);

      if (isNaN(id) || isNaN(version)) {
        const error = new Error('ID de embudo y número de versión deben ser enteros válidos');
        error.statusCode = 400;
        error.code = 'INVALID_PARAM';
        throw error;
      }

      const result = await FunnelService.restoreVersion({
        id,
        userId: req.user.id,
        role: req.user.role,
        version
      });

      return res.status(200).json({
        success: true,
        data: result,
        message: `Lienzo restaurado a la versión ${version} exitosamente`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = FunnelController;
