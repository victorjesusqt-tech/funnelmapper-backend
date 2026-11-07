const express = require('express');
const TemplateController = require('../controllers/templateController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas de templates requieren usuario autenticado
router.use(verificarToken);

/**
 * @route   GET /api/templates
 * @desc    Listar plantillas públicas paginadas (?page=1&limit=10&category=...&search=...)
 * @access  Privado (viewer, editor, admin)
 */
router.get('/', TemplateController.list);

/**
 * @route   GET /api/templates/featured
 * @desc    Listar plantillas destacadas
 * @access  Privado (viewer, editor, admin)
 */
router.get('/featured', TemplateController.getFeatured);

/**
 * @route   GET /api/templates/category/:cat
 * @desc    Filtrar plantillas por categoría
 * @access  Privado (viewer, editor, admin)
 */
router.get('/category/:cat', TemplateController.getByCategory);

/**
 * @route   GET /api/templates/:id
 * @desc    Obtener detalle completo de una plantilla por ID
 * @access  Privado (viewer, editor, admin)
 */
router.get('/:id', TemplateController.getById);

/**
 * @route   POST /api/templates/:id/use
 * @desc    Crear un nuevo embudo en un proyecto a partir de la plantilla
 * @access  Privado (editor, admin)
 */
router.post(
  '/:id/use',
  verificarRol('editor', 'admin'),
  TemplateController.useTemplate
);

module.exports = router;
