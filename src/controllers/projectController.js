const ProjectService = require('../services/projectService');

class ProjectController {
  /**
   * POST /api/projects
   * Crear nuevo proyecto
   */
  static async create(req, res, next) {
    try {
      const { name, description, color, is_public } = req.body;
      const userId = req.user.id;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const project = await ProjectService.createProject({
        userId,
        name,
        description,
        color,
        isPublic: is_public,
        ipAddress,
        userAgent
      });

      return res.status(201).json({
        success: true,
        data: project,
        message: 'Proyecto creado exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects
   * Listar proyectos con paginación
   */
  static async list(req, res, next) {
    try {
      const { page, limit, status, search } = req.query;
      const userId = req.user.id;
      const role = req.user.role;

      const result = await ProjectService.getUserProjects({
        userId,
        role,
        page,
        limit,
        status,
        search
      });

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Proyectos listados exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects/:id
   * Obtener proyecto por ID
   */
  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user.id;
      const role = req.user.role;

      const project = await ProjectService.getProjectById({
        id,
        userId,
        role
      });

      return res.status(200).json({
        success: true,
        data: project,
        message: 'Proyecto obtenido exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/projects/:id
   * Actualizar proyecto
   */
  static async update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user.id;
      const role = req.user.role;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const updatedProject = await ProjectService.updateProject({
        id,
        userId,
        role,
        data: req.body,
        ipAddress,
        userAgent
      });

      return res.status(200).json({
        success: true,
        data: updatedProject,
        message: 'Proyecto actualizado exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/projects/:id
   * Eliminar proyecto (requiere rol admin)
   */
  static async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user.id;
      const role = req.user.role;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      await ProjectService.deleteProject({
        id,
        userId,
        role,
        ipAddress,
        userAgent
      });

      return res.status(200).json({
        success: true,
        data: null,
        message: 'Proyecto eliminado exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/projects/:id/archive
   * Archivar / Desarchivar proyecto
   */
  static async toggleArchive(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user.id;
      const role = req.user.role;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const project = await ProjectService.toggleArchive({
        id,
        userId,
        role,
        ipAddress,
        userAgent
      });

      const actionText = project.status === 'archived' ? 'archivado' : 'desarchivado';

      return res.status(200).json({
        success: true,
        data: project,
        message: `Proyecto ${actionText} exitosamente`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects/:id/stats
   * Estadísticas rápidas del proyecto
   */
  static async getStats(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user.id;
      const role = req.user.role;

      const stats = await ProjectService.getProjectStats({
        id,
        userId,
        role
      });

      return res.status(200).json({
        success: true,
        data: stats,
        message: 'Estadísticas del proyecto obtenidas exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProjectController;
