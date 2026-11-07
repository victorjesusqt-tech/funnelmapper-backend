const FunnelModel = require('../models/funnelModel');
const NodeModel = require('../models/nodeModel');
const MetricsModel = require('../models/metricsModel');
const logger = require('../utils/logger');

/**
 * Servicio para parseo, validación e importación de métricas desde archivos CSV.
 */
class CsvImportService {
  /**
   * Parsea un texto CSV considerando comas, punto y coma y valores entre comillas.
   * @param {string} csvText
   * @returns {Array<Object>}
   */
  static parseCsv(csvText) {
    if (!csvText || typeof csvText !== 'string') return [];

    const lines = csvText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length < 2) return [];

    // Detectar delimitador (coma o punto y coma)
    const headerLine = lines[0];
    const delimiter = headerLine.includes(';') && !headerLine.includes(',') ? ';' : ',';

    // Parsear fila respetando comillas
    const parseLine = (line) => {
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          values.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^["']|["']$/g, ''));
      return values;
    };

    const headers = parseLine(lines[0]).map(h => h.trim().toLowerCase());

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.length === 0 || (values.length === 1 && !values[0])) continue;

      const rowObj = {};
      headers.forEach((header, index) => {
        rowObj[header] = values[index] !== undefined ? values[index] : '';
      });
      rows.push(rowObj);
    }

    return rows;
  }

  /**
   * Importa filas de métricas desde CSV al embudo especificado.
   */
  static async importCsv({ funnelId, csvContent, userId, role }) {
    const funnel = await FunnelModel.findById(funnelId);
    if (!funnel) {
      const error = new Error(`Embudo con ID ${funnelId} no encontrado`);
      error.statusCode = 404;
      error.code = 'FUNNEL_NOT_FOUND';
      throw error;
    }

    if (role !== 'admin' && funnel.project_owner_id !== userId) {
      const error = new Error('No tienes permiso para importar métricas en este embudo');
      error.statusCode = 403;
      error.code = 'FUNNEL_ACCESS_DENIED';
      throw error;
    }

    const csvText = typeof csvContent === 'string'
      ? csvContent
      : (Buffer.isBuffer(csvContent) ? csvContent.toString('utf-8') : '');

    const parsedRows = this.parseCsv(csvText);

    if (parsedRows.length === 0) {
      const error = new Error('El archivo CSV está vacío o no contiene registros válidos');
      error.statusCode = 422;
      error.code = 'CSV_EMPTY';
      throw error;
    }

    // Obtener los nodos existentes en este embudo
    const nodes = await NodeModel.findByFunnelId(funnelId);
    const nodeMap = new Map();
    nodes.forEach(n => {
      nodeMap.set(n.label.trim().toLowerCase(), n);
      // También permitir mapeo por ID directo
      nodeMap.set(String(n.id), n);
    });

    let imported = 0;
    let skipped = 0;
    const errors = [];

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      const rowNum = i + 2; // Línea física en archivo (+1 base, +1 header)

      // Identificar nodo
      const nodeIdentifier = (row.node_label || row.node || row.label || row.node_id || '').trim();
      if (!nodeIdentifier) {
        errors.push({ row: rowNum, error: 'Falta la columna node_label o está vacía' });
        skipped++;
        continue;
      }

      const node = nodeMap.get(nodeIdentifier.toLowerCase()) || nodeMap.get(nodeIdentifier);
      if (!node) {
        errors.push({
          row: rowNum,
          node: nodeIdentifier,
          error: `No existe ningún nodo con la etiqueta "${nodeIdentifier}" en este embudo`
        });
        skipped++;
        continue;
      }

      // Validar fecha
      const metricDate = (row.metric_date || row.date || new Date().toISOString().split('T')[0]).trim();
      if (!dateRegex.test(metricDate)) {
        errors.push({
          row: rowNum,
          error: `Formato de fecha inválido "${metricDate}". Debe ser YYYY-MM-DD`
        });
        skipped++;
        continue;
      }

      const periodType = (row.period_type || row.period || 'day').trim().toLowerCase();
      const validPeriod = ['day', 'week', 'month'].includes(periodType) ? periodType : 'day';

      const visitors = Math.max(0, parseInt(row.visitors, 10) || 0);
      const uniqueVisitors = Math.max(0, parseInt(row.unique_visitors, 10) || 0);
      const clicks = Math.max(0, parseInt(row.clicks, 10) || 0);
      const conversions = Math.max(0, parseInt(row.conversions, 10) || 0);
      const revenue = Math.max(0, parseFloat(row.revenue) || 0.00);
      const cost = Math.max(0, parseFloat(row.cost) || 0.00);
      const bounceRate = Math.min(100, Math.max(0, parseFloat(row.bounce_rate) || 0));
      const avgTimeSec = Math.max(0, parseInt(row.avg_time_sec, 10) || 0);

      try {
        await MetricsModel.upsert({
          nodeId: node.id,
          funnelId,
          metricDate,
          periodType: validPeriod,
          visitors,
          uniqueVisitors,
          clicks,
          conversions,
          revenue,
          cost,
          bounceRate,
          avgTimeSec,
          source: 'csv_import',
          notes: `Importado desde CSV fila ${rowNum}`,
          createdBy: userId
        });
        imported++;
      } catch (err) {
        logger.error(`Error importando fila ${rowNum} de CSV: ${err.message}`);
        errors.push({ row: rowNum, error: err.message });
        skipped++;
      }
    }

    return {
      funnelId,
      totalRows: parsedRows.length,
      imported,
      skipped,
      errors
    };
  }
}

module.exports = CsvImportService;

