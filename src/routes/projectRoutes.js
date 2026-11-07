const express = require('express');
const ProjectController = require('../controllers/projectController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const {
  createProjectValidator,
  updateProjectValidator,
  projectIdValidator,
  projectQueryValidator
} = require('../utils/validators');

const router = express.Router();

// Todas las rutas de proyectos requieren token JWT válido
router.use(verificarToken);

/**
 * @route   GET /api/projects
 * @desc    Listar proyectos del usuario (paginado)
 * @access  Privado (viewer, editor, admin)
 */
router.get(
  '/',
  verificarRol('viewer', 'editor', 'admin'),
  projectQueryValidator,
  validateRequest,
  ProjectController.list
);

/**
 * @route   POST /api/projects
 * @desc    Crear un nuevo proyecto
 * @access  Privado (editor, admin)
 */
router.post(
  '/',
  verificarRol('editor', 'admin'),
  createProjectValidator,
  validateRequest,
  ProjectController.create
);

/**
 * @route   GET /api/projects/:id
 * @desc    Obtener detalles de un proyecto
 * @access  Privado (viewer, editor, admin)
 */
router.get(
  '/:id',
  verificarRol('viewer', 'editor', 'admin'),
  projectIdValidator,
  validateRequest,
  ProjectController.getById
);

/**
 * @route   PUT /api/projects/:id
 * @desc    Actualizar un proyecto existente
 * @access  Privado (editor, admin)
 */
router.put(
  '/:id',
  verificarRol('editor', 'admin'),
  updateProjectValidator,
  validateRequest,
  ProjectController.update
);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Eliminar un proyecto y todos sus embudos
 * @access  Privado (solo admin)
 */
router.delete(
  '/:id',
  verificarRol('admin'),
  projectIdValidator,
  validateRequest,
  ProjectController.delete
);

/**
 * @route   PATCH /api/projects/:id/archive
 * @desc    Archivar o desarchivar un proyecto
 * @access  Privado (editor, admin)
 */
router.patch(
  '/:id/archive',
  verificarRol('editor', 'admin'),
  projectIdValidator,
  validateRequest,
  ProjectController.toggleArchive
);

/**
 * @route   GET /api/projects/:id/stats
 * @desc    Obtener estadísticas rápidas del proyecto
 * @access  Privado (viewer, editor, admin)
 */
router.get(
  '/:id/stats',
  verificarRol('viewer', 'editor', 'admin'),
  projectIdValidator,
  validateRequest,
  ProjectController.getStats
);

module.exports = router;
