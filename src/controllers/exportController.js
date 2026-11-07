const ExportService = require('../services/exportService');

/**
 * Controlador HTTP para endpoints de exportación y descarga de archivos.
 */
class ExportController {
  /**
   * POST /api/export/funnel/:id/json
   * Exportar embudo completo como JSON
   */
  static async exportJSON(req, res, next) {
    try {
      const funnelId = parseInt(req.params.id, 10);
      if (isNaN(funnelId)) {
        const error = new Error('El ID del embudo debe ser un número entero');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const result = await ExportService.exportToJSON(funnelId, req.user.id, req.user.role);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Embudo exportado a JSON exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/export/funnel/:id/csv
   * Exportar métricas del embudo como CSV
   */
  static async exportCSV(req, res, next) {
    try {
      const funnelId = parseInt(req.params.id, 10);
      if (isNaN(funnelId)) {
        const error = new Error('El ID del embudo debe ser un número entero');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const result = await ExportService.exportToCSV(funnelId, req.user.id, req.user.role);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Métricas exportadas a CSV exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/export/funnel/:id/png
   * Exportar imagen de alta resolución PNG del canvas
   */
  static async exportPNG(req, res, next) {
    try {
      const funnelId = parseInt(req.params.id, 10);
      if (isNaN(funnelId)) {
        const error = new Error('El ID del embudo debe ser un número entero');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const base64Image = req.body.image || req.body.imageData;
      const result = await ExportService.exportToPNG(
        funnelId,
        req.user.id,
        req.user.role,
        base64Image
      );

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Imagen PNG exportada exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/export/funnel/:id/pdf
   * Exportar reporte ejecutivo en PDF con Puppeteer
   */
  static async exportPDF(req, res, next) {
    try {
      const funnelId = parseInt(req.params.id, 10);
      if (isNaN(funnelId)) {
        const error = new Error('El ID del embudo debe ser un número entero');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const result = await ExportService.exportToPDF(
        funnelId,
        req.user.id,
        req.user.role
      );

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Reporte PDF generado exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/export/download/:exportId
   * Descarga física del archivo exportado
   */
  static async downloadFile(req, res, next) {
    try {
      const exportId = parseInt(req.params.exportId, 10);
      if (isNaN(exportId)) {
        const error = new Error('El ID de exportación debe ser un número entero');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const fileInfo = await ExportService.getExportFile(
        exportId,
        req.user.id,
        req.user.role
      );

      res.setHeader('Content-Type', fileInfo.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.filename}"`);

      return res.download(fileInfo.filePath, fileInfo.filename);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/export/funnel/:id/history
   * Obtener historial de exportaciones de un embudo
   */
  static async getHistory(req, res, next) {
    try {
      const funnelId = parseInt(req.params.id, 10);
      if (isNaN(funnelId)) {
        const error = new Error('El ID del embudo debe ser un número entero');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const history = await ExportService.getFunnelExportHistory(
        funnelId,
        req.user.id,
        req.user.role
      );

      return res.status(200).json({
        success: true,
        data: history,
        count: history.length,
        message: 'Historial de exportaciones obtenido exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ExportController;

