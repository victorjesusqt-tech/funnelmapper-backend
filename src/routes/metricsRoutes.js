const express = require('express');
const multer = require('multer');
const MetricsController = require('../controllers/metricsController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

const router = express.Router();

// Configuración de multer en memoria para carga de CSV (máximo 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Todas las rutas de métricas requieren usuario autenticado
router.use(verificarToken);

/**
 * @route   GET /api/metrics/funnel/:funnelId/summary
 * @desc    KPIs totales del embudo (totales, promedios, ROI, ROAS, desglose por nodo)
 * @access  Privado (viewer, editor, admin)
 */
router.get(
  '/funnel/:funnelId/summary',
  verificarRol('viewer', 'editor', 'admin'),
  MetricsController.getFunnelSummary
);

/**
 * @route   GET /api/metrics/funnel/:funnelId/conversion-flow
 * @desc    Tasas de conversión paso a paso (nodo a nodo) entre conexiones
 * @access  Privado (viewer, editor, admin)
 */
router.get(
  '/funnel/:funnelId/conversion-flow',
  verificarRol('viewer', 'editor', 'admin'),
  MetricsController.getConversionFlow
);

/**
 * @route   GET /api/metrics/funnel/:funnelId/goals
 * @desc    Objetivos configurados para todos los nodos del embudo
 * @access  Privado (viewer, editor, admin)
 */
router.get(
  '/funnel/:funnelId/goals',
  verificarRol('viewer', 'editor', 'admin'),
  MetricsController.getFunnelGoals
);

/**
 * @route   POST /api/metrics/funnel/:funnelId/import-csv
 * @desc    Importar métricas desde un archivo CSV
 * @access  Privado (editor, admin)
 */
router.post(
  '/funnel/:funnelId/import-csv',
  verificarRol('editor', 'admin'),
  upload.single('file'),
  MetricsController.importCsv
);

/**
 * @route   GET /api/metrics/funnel/:funnelId
 * @desc    Listar todas las métricas históricas de un embudo
 * @access  Privado (viewer, editor, admin)
 */
router.get(
  '/funnel/:funnelId',
  verificarRol('viewer', 'editor', 'admin'),
  MetricsController.getFunnelMetrics
);

/**
 * @route   GET /api/metrics/node/:nodeId/goals
 * @desc    Objetivos configurados para un nodo
 * @access  Privado (viewer, editor, admin)
 */
router.get(
  '/node/:nodeId/goals',
  verificarRol('viewer', 'editor', 'admin'),
  MetricsController.getNodeGoals
);

/**
 * @route   POST /api/metrics/node/:nodeId/goals
 * @desc    Crear o actualizar objetivos para un nodo
 * @access  Privado (editor, admin)
 */
router.post(
  '/node/:nodeId/goals',
  verificarRol('editor', 'admin'),
  MetricsController.setGoal
);

/**
 * @route   GET /api/metrics/node/:nodeId
 * @desc    Métricas históricas de un nodo
 * @access  Privado (viewer, editor, admin)
 */
router.get(
  '/node/:nodeId',
  verificarRol('viewer', 'editor', 'admin'),
  MetricsController.getNodeMetrics
);

/**
 * @route   POST /api/metrics
 * @desc    Registrar o actualizar métricas para un nodo (UPSERT)
 * @access  Privado (editor, admin)
 */
router.post(
  '/',
  verificarRol('editor', 'admin'),
  MetricsController.recordMetrics
);

/**
 * @route   PUT /api/metrics/:id
 * @desc    Actualizar un registro específico de métricas
 * @access  Privado (editor, admin)
 */
router.put(
  '/:id',
  verificarRol('editor', 'admin'),
  MetricsController.updateMetrics
);

/**
 * @route   DELETE /api/metrics/:id
 * @desc    Eliminar un registro de métricas
 * @access  Privado (editor, admin)
 */
router.delete(
  '/:id',
  verificarRol('editor', 'admin'),
  MetricsController.deleteMetrics
);

module.exports = router;

