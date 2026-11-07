const AnalyticsService = require('../services/analyticsService');
const CsvImportService = require('../services/csvImportService');

/**
 * Controlador HTTP para endpoints de métricas, análisis de conversión y metas.
 */
class MetricsController {
  /**
   * POST /api/metrics
   * Registrar o actualizar métricas para un nodo (UPSERT)
   */
  static async recordMetrics(req, res, next) {
    try {
      const {
        nodeId,
        metricDate,
        periodType,
        visitors,
        uniqueVisitors,
        clicks,
        conversions,
        revenue,
        cost,
        bounceRate,
        avgTimeSec,
        customKpis,
        source,
        notes
      } = req.body;

      if (!nodeId || !metricDate) {
        const error = new Error('Los campos nodeId y metricDate son requeridos');
        error.statusCode = 422;
        error.code = 'VALIDATION_ERROR';
        throw error;
      }

      const metric = await AnalyticsService.recordMetrics({
        nodeId: parseInt(nodeId, 10),
        metricDate,
        periodType,
        visitors,
        uniqueVisitors,
        clicks,
        conversions,
        revenue,
        cost,
        bounceRate,
        avgTimeSec,
        customKpis,
        source,
        notes,
        userId: req.user.id,
        role: req.user.role
      });

      return res.status(201).json({
        success: true,
        data: metric,
        message: 'Métricas registradas exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/metrics/:id
   * Actualizar un registro específico de métricas
   */
  static async updateMetrics(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        const error = new Error('El ID de la métrica debe ser un número entero válido');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const updated = await AnalyticsService.updateMetrics(
        id,
        req.body,
        req.user.id,
        req.user.role
      );

      return res.status(200).json({
        success: true,
        data: updated,
        message: 'Registro de métricas actualizado exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/metrics/:id
   * Eliminar un registro de métricas
   */
  static async deleteMetrics(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        const error = new Error('El ID de la métrica debe ser un número entero válido');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      await AnalyticsService.deleteMetrics(id, req.user.id, req.user.role);

      return res.status(200).json({
        success: true,
        data: { id },
        message: 'Registro de métricas eliminado exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/metrics/node/:nodeId
   * Obtener historial de métricas de un nodo
   */
  static async getNodeMetrics(req, res, next) {
    try {
      const nodeId = parseInt(req.params.nodeId, 10);
      if (isNaN(nodeId)) {
        const error = new Error('El ID del nodo debe ser un número entero válido');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const { startDate, endDate, periodType } = req.query;
      const metrics = await AnalyticsService.getNodeMetrics(
        nodeId,
        { startDate, endDate, periodType },
        req.user.id,
        req.user.role
      );

      return res.status(200).json({
        success: true,
        data: metrics,
        count: metrics.length,
        message: 'Métricas del nodo obtenidas exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/metrics/funnel/:funnelId
   * Obtener todas las métricas de un embudo
   */
  static async getFunnelMetrics(req, res, next) {
    try {
      const funnelId = parseInt(req.params.funnelId, 10);
      if (isNaN(funnelId)) {
        const error = new Error('El ID del embudo debe ser un número entero válido');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const { startDate, endDate, periodType } = req.query;
      const metrics = await AnalyticsService.getFunnelMetrics(
        funnelId,
        { startDate, endDate, periodType },
        req.user.id,
        req.user.role
      );

      return res.status(200).json({
        success: true,
        data: metrics,
        count: metrics.length,
        message: 'Métricas del embudo obtenidas exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/metrics/funnel/:funnelId/summary
   * Obtener KPIs agregados del embudo (totales, promedios, ROI, ROAS, desglose)
   */
  static async getFunnelSummary(req, res, next) {
    try {
      const funnelId = parseInt(req.params.funnelId, 10);
      if (isNaN(funnelId)) {
        const error = new Error('El ID del embudo debe ser un número entero válido');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const { startDate, endDate, periodType } = req.query;
      const summary = await AnalyticsService.getFunnelSummary(
        funnelId,
        { startDate, endDate, periodType },
        req.user.id,
        req.user.role
      );

      return res.status(200).json({
        success: true,
        data: summary,
        message: 'Resumen cuantitativo del embudo obtenido exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/metrics/funnel/:funnelId/conversion-flow
   * Obtener tasas de conversión paso a paso (conexión a conexión) y cuellos de botella
   */
  static async getConversionFlow(req, res, next) {
    try {
      const funnelId = parseInt(req.params.funnelId, 10);
      if (isNaN(funnelId)) {
        const error = new Error('El ID del embudo debe ser un número entero válido');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const { startDate, endDate } = req.query;
      const flow = await AnalyticsService.getConversionFlow(
        funnelId,
        { startDate, endDate },
        req.user.id,
        req.user.role
      );

      return res.status(200).json({
        success: true,
        data: flow,
        message: 'Flujo de conversión nodo a nodo obtenido exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/metrics/node/:nodeId/goals
   * Crear o actualizar objetivos para un nodo
   */
  static async setGoal(req, res, next) {
    try {
      const nodeId = parseInt(req.params.nodeId, 10);
      if (isNaN(nodeId)) {
        const error = new Error('El ID del nodo debe ser un número entero válido');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const goal = await AnalyticsService.setNodeGoal(
        nodeId,
        req.body,
        req.user.id,
        req.user.role
      );

      return res.status(201).json({
        success: true,
        data: goal,
        message: 'Objetivos del nodo configurados exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/metrics/node/:nodeId/goals
   * Obtener objetivos configurados para un nodo
   */
  static async getNodeGoals(req, res, next) {
    try {
      const nodeId = parseInt(req.params.nodeId, 10);
      if (isNaN(nodeId)) {
        const error = new Error('El ID del nodo debe ser un número entero válido');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const goals = await AnalyticsService.getNodeGoals(
        nodeId,
        req.user.id,
        req.user.role
      );

      return res.status(200).json({
        success: true,
        data: goals,
        count: goals.length,
        message: 'Objetivos del nodo obtenidos exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/metrics/funnel/:funnelId/goals
   * Obtener todos los objetivos de los nodos del embudo
   */
  static async getFunnelGoals(req, res, next) {
    try {
      const funnelId = parseInt(req.params.funnelId, 10);
      if (isNaN(funnelId)) {
        const error = new Error('El ID del embudo debe ser un número entero válido');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      const goals = await AnalyticsService.getFunnelGoals(
        funnelId,
        req.user.id,
        req.user.role
      );

      return res.status(200).json({
        success: true,
        data: goals,
        count: goals.length,
        message: 'Objetivos del embudo obtenidos exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/metrics/funnel/:funnelId/import-csv
   * Importar métricas desde un archivo CSV o payload de texto
   */
  static async importCsv(req, res, next) {
    try {
      const funnelId = parseInt(req.params.funnelId, 10);
      if (isNaN(funnelId)) {
        const error = new Error('El ID del embudo debe ser un número entero válido');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }

      let csvContent = null;
      if (req.file && req.file.buffer) {
        csvContent = req.file.buffer.toString('utf-8');
      } else if (req.body && req.body.csvData) {
        csvContent = req.body.csvData;
      } else if (typeof req.body === 'string') {
        csvContent = req.body;
      }

      if (!csvContent) {
        const error = new Error('No se proporcionó ningún archivo ni texto CSV (csvData)');
        error.statusCode = 422;
        error.code = 'CSV_REQUIRED';
        throw error;
      }

      const result = await CsvImportService.importCsv({
        funnelId,
        csvContent,
        userId: req.user.id,
        role: req.user.role
      });

      return res.status(200).json({
        success: true,
        data: result,
        message: `Importación completada: ${result.imported} registros importados, ${result.skipped} omitidos`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MetricsController;

