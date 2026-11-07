const ProjectModel = require('../models/projectModel');
const ActivityLogModel = require('../models/activityLogModel');

class ProjectService {
  /**
   * Crear nuevo proyecto
   */
  static async createProject({ userId, name, description, color, isPublic, ipAddress = null, userAgent = null }) {
    const newProject = await ProjectModel.create({
      userId,
      name,
      description,
      color,
      isPublic,
      status: 'active'
    });

    // Registrar en activity_logs
    await ActivityLogModel.log({
      userId,
      projectId: newProject.id,
      action: 'PROJECT_CREATED',
      entityType: 'project',
      entityId: newProject.id,
      details: { name: newProject.name, color: newProject.color },
      ipAddress,
      userAgent
    });

    return newProject;
  }

  /**
   * Listar proyectos del usuario con paginación
   */
  static async getUserProjects({ userId, role, page = 1, limit = 20, status = null, search = null }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const isAdmin = role === 'admin';

    const { items, total } = await ProjectModel.findUserProjects({
      userId,
      isAdmin,
      page: pageNum,
      limit: limitNum,
      status,
      search
    });

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    };
  }

  /**
   * Obtener proyecto por ID con validación de acceso
   */
  static async getProjectById({ id, userId, role }) {
    const project = await ProjectModel.findById(id);
    if (!project) {
      const error = new Error('Proyecto no encontrado');
      error.code = 'PROJECT_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    const isAdmin = role === 'admin';
    const isOwner = project.user_id === userId;
    const isPublic = project.is_public === 1;

    if (!isAdmin && !isOwner && !isPublic) {
      const error = new Error('No tienes permiso para acceder a este proyecto');
      error.code = 'PROJECT_ACCESS_DENIED';
      error.statusCode = 403;
      throw error;
    }

    return project;
  }

  /**
   * Actualizar un proyecto
   */
  static async updateProject({ id, userId, role, data, ipAddress = null, userAgent = null }) {
    const project = await ProjectModel.findById(id);
    if (!project) {
      const error = new Error('Proyecto no encontrado');
      error.code = 'PROJECT_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    const isAdmin = role === 'admin';
    const isOwner = project.user_id === userId;

    if (!isAdmin && !isOwner) {
      const error = new Error('No tienes permiso para modificar este proyecto');
      error.code = 'PROJECT_ACCESS_DENIED';
      error.statusCode = 403;
      throw error;
    }

    const updatedProject = await ProjectModel.update(id, data);

    await ActivityLogModel.log({
      userId,
      projectId: id,
      action: 'PROJECT_UPDATED',
      entityType: 'project',
      entityId: id,
      details: data,
      ipAddress,
      userAgent
    });

    return updatedProject;
  }

  /**
   * Eliminar un proyecto
   */
  static async deleteProject({ id, userId, role, ipAddress = null, userAgent = null }) {
    const project = await ProjectModel.findById(id);
    if (!project) {
      const error = new Error('Proyecto no encontrado');
      error.code = 'PROJECT_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    // Rol admin requerido
    if (role !== 'admin') {
      const error = new Error('Se requiere rol de administrador para eliminar proyectos');
      error.code = 'INSUFFICIENT_ROLE';
      error.statusCode = 403;
      throw error;
    }

    await ProjectModel.delete(id);

    await ActivityLogModel.log({
      userId,
      projectId: id,
      action: 'PROJECT_DELETED',
      entityType: 'project',
      entityId: id,
      details: { name: project.name },
      ipAddress,
      userAgent
    });

    return true;
  }

  /**
   * Archivar / Desarchivar un proyecto
   */
  static async toggleArchive({ id, userId, role, ipAddress = null, userAgent = null }) {
    const project = await ProjectModel.findById(id);
    if (!project) {
      const error = new Error('Proyecto no encontrado');
      error.code = 'PROJECT_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    const isAdmin = role === 'admin';
    const isOwner = project.user_id === userId;

    if (!isAdmin && !isOwner) {
      const error = new Error('No tienes permiso para archivar este proyecto');
      error.code = 'PROJECT_ACCESS_DENIED';
      error.statusCode = 403;
      throw error;
    }

    const newStatus = project.status === 'archived' ? 'active' : 'archived';
    const updated = await ProjectModel.toggleArchive(id, newStatus);

    await ActivityLogModel.log({
      userId,
      projectId: id,
      action: newStatus === 'archived' ? 'PROJECT_ARCHIVED' : 'PROJECT_UNARCHIVED',
      entityType: 'project',
      entityId: id,
      details: { oldStatus: project.status, newStatus },
      ipAddress,
      userAgent
    });

    return updated;
  }

  /**
   * Obtener estadísticas rápidas del proyecto
   */
  static async getProjectStats({ id, userId, role }) {
    // Validar existencia y permiso
    await this.getProjectById({ id, userId, role });
    return await ProjectModel.getStats(id);
  }
}

module.exports = ProjectService;
