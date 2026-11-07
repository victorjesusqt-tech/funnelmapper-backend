const NodeTypeModel = require('../models/nodeTypeModel');

class NodeTypeController {
  /**
   * GET /api/node-types
   * Listar todos los tipos de nodos activos (con filtro opcional de categoría)
   */
  static async list(req, res, next) {
    try {
      const { category } = req.query;
      const nodeTypes = await NodeTypeModel.findAll({ category });

      return res.status(200).json({
        success: true,
        data: nodeTypes,
        count: nodeTypes.length,
        message: 'Tipos de nodo obtenidos exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/node-types/categories
   * Listar categorías disponibles con conteo de elementos
   */
  static async getCategories(req, res, next) {
    try {
      const categories = await NodeTypeModel.findCategories();

      return res.status(200).json({
        success: true,
        data: categories,
        message: 'Categorías de tipos de nodo obtenidas exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/node-types/:id
   * Obtener un tipo de nodo por su ID numérico
   */
  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        const error = new Error('El ID del tipo de nodo debe ser un número entero');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const nodeType = await NodeTypeModel.findById(id);
      if (!nodeType) {
        const error = new Error(`Tipo de nodo con ID ${id} no encontrado`);
        error.statusCode = 404;
        error.code = 'NODE_TYPE_NOT_FOUND';
        throw error;
      }

      return res.status(200).json({
        success: true,
        data: nodeType,
        message: 'Tipo de nodo obtenido exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/node-types/slug/:slug
   * Obtener un tipo de nodo por su slug único
   */
  static async getBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const nodeType = await NodeTypeModel.findBySlug(slug);

      if (!nodeType) {
        const error = new Error(`Tipo de nodo con slug '${slug}' no encontrado`);
        error.statusCode = 404;
        error.code = 'NODE_TYPE_NOT_FOUND';
        throw error;
      }

      return res.status(200).json({
        success: true,
        data: nodeType,
        message: 'Tipo de nodo obtenido exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = NodeTypeController;
