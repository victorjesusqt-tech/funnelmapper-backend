const express = require('express');
const NodeTypeController = require('../controllers/nodeTypeController');
const { verificarToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas de datos maestros de tipos de nodo requieren autenticación
router.use(verificarToken);

/**
 * @route   GET /api/node-types
 * @desc    Listar todos los tipos de nodo activos (filtro ?category=...)
 * @access  Privado (Cualquier usuario autenticado)
 */
router.get('/', NodeTypeController.list);

/**
 * @route   GET /api/node-types/categories
 * @desc    Listar categorías disponibles de tipos de nodo con su conteo
 * @access  Privado
 */
router.get('/categories', NodeTypeController.getCategories);

/**
 * @route   GET /api/node-types/slug/:slug
 * @desc    Obtener tipo de nodo por slug
 * @access  Privado
 */
router.get('/slug/:slug', NodeTypeController.getBySlug);

/**
 * @route   GET /api/node-types/:id
 * @desc    Obtener tipo de nodo por ID
 * @access  Privado
 */
router.get('/:id', NodeTypeController.getById);

module.exports = router;
