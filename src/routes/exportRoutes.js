const express = require('express');
const ExportController = require('../controllers/exportController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas de exportación requieren autenticación
router.use(verificarToken);

/**
 * @route   POST /api/export/funnel/:id/json
 * @desc    Exportar estado del embudo como JSON importable
 * @access  Privado (editor, admin)
 */
router.post(
  '/funnel/:id/json',
  verificarRol('editor', 'admin'),
  ExportController.exportJSON
);

/**
 * @route   POST /api/export/funnel/:id/csv
 * @desc    Exportar métricas históricas a CSV
 * @access  Privado (editor, admin)
 */
router.post(
  '/funnel/:id/csv',
  verificarRol('editor', 'admin'),
  ExportController.exportCSV
);

/**
 * @route   POST /api/export/funnel/:id/png
 * @desc    Guardar exportación PNG del canvas
 * @access  Privado (editor, admin)
 */
router.post(
  '/funnel/:id/png',
  verificarRol('editor', 'admin'),
  ExportController.exportPNG
);

/**
 * @route   POST /api/export/funnel/:id/pdf
 * @desc    Generar y exportar reporte en PDF
 * @access  Privado (editor, admin)
 */
router.post(
  '/funnel/:id/pdf',
  verificarRol('editor', 'admin'),
  ExportController.exportPDF
);

/**
 * @route   GET /api/export/download/:exportId
 * @desc    Descargar archivo físico generado
 * @access  Privado (viewer, editor, admin)
 */
router.get(
  '/download/:exportId',
  verificarRol('viewer', 'editor', 'admin'),
  ExportController.downloadFile
);

/**
 * @route   GET /api/export/funnel/:id/history
 * @desc    Historial de exportaciones del embudo
 * @access  Privado (viewer, editor, admin)
 */
router.get(
  '/funnel/:id/history',
  verificarRol('viewer', 'editor', 'admin'),
  ExportController.getHistory
);

module.exports = router;

