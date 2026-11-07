const express = require('express');
const FunnelController = require('../controllers/funnelController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas de embudos requieren usuario autenticado
router.use(verificarToken);

/**
 * @route   GET /api/funnels/project/:projectId
 * @desc    Listar embudos pertenecientes a un proyecto
 * @access  Privado (viewer, editor, admin)
 */
router.get(
  '/project/:projectId',
  verificarRol('viewer', 'editor', 'admin'),
  FunnelController.listByProject
);

/**
 * @route   POST /api/funnels
 * @desc    Crear nuevo embudo en blanco dentro de un proyecto
 * @access  Privado (editor, admin)
 */
router.post(
  '/',
  verificarRol('editor', 'admin'),
  FunnelController.create
);

/**
 * @route   POST /api/funnels/:id/duplicate
 * @desc    Duplicar un embudo completo con sus nodos y conexiones
 * @access  Privado (editor, admin)
 */
router.post(
  '/:id/duplicate',
  verificarRol('editor', 'admin'),
  FunnelController.duplicate
);

/**
 * @route   POST /api/funnels/:id/canvas
 * @desc    Guardar estado completo del canvas (JSON)
 * @access  Privado (editor, admin)
 */
router.post(
  '/:id/canvas',
  verificarRol('editor', 'admin'),
  FunnelController.saveCanvas
);

/**
 * @route   GET /api/funnels/:id/canvas
 * @desc    Cargar estado del canvas para el editor
 * @access  Privado (viewer, editor, admin)
 */
router.get(
  '/:id/canvas',
  verificarRol('viewer', 'editor', 'admin'),
  FunnelController.getCanvas
);

/**
 * @route   GET /api/funnels/:id/versions
 * @desc    Listar historial de versiones guardadas
 * @access  Privado (viewer, editor, admin)
 */
router.get(
  '/:id/versions',
  verificarRol('viewer', 'editor', 'admin'),
  FunnelController.getVersions
);

/**
 * @route   POST /api/funnels/:id/restore/:version
 * @desc    Restaurar una versión específica
 * @access  Privado (editor, admin)
 */
router.post(
  '/:id/restore/:version',
  verificarRol('editor', 'admin'),
  FunnelController.restoreVersion
);

/**
 * @route   GET /api/funnels/:id
 * @desc    Obtener embudo completo con sus nodos y conexiones
 * @access  Privado (viewer, editor, admin)
 */
router.get(
  '/:id',
  verificarRol('viewer', 'editor', 'admin'),
  FunnelController.getById
);

/**
 * @route   PUT /api/funnels/:id
 * @desc    Actualizar metadatos o estado del canvas de un embudo
 * @access  Privado (editor, admin)
 */
router.put(
  '/:id',
  verificarRol('editor', 'admin'),
  FunnelController.update
);

/**
 * @route   DELETE /api/funnels/:id
 * @desc    Eliminar embudo y todos sus nodos/conexiones en cascada
 * @access  Privado (editor, admin)
 */
router.delete(
  '/:id',
  verificarRol('editor', 'admin'),
  FunnelController.delete
);

module.exports = router;
