const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ExportModel = require('../models/exportModel');
const FunnelModel = require('../models/funnelModel');
const NodeModel = require('../models/nodeModel');
const ConnectionModel = require('../models/connectionModel');
const MetricsModel = require('../models/metricsModel');
const AnalyticsService = require('./analyticsService');
const logger = require('../utils/logger');

/**
 * Servicio encargado de generar y gestionar exportaciones en formatos PNG, PDF, JSON y CSV.
 */
class ExportService {
  /**
   * Carga dinámica de puppeteer-core compatible con módulos ES en CommonJS y Jest.
   * @private
   */
  static async _getPuppeteer() {
    const dynamicImport = new Function('specifier', 'return import(specifier)');
    try {
      const mod = await dynamicImport('puppeteer-core');
      return mod.default || mod;
    } catch (e1) {
      try {
        const fullPath = path.resolve(__dirname, '../../node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
        const fileUrl = require('url').pathToFileURL(fullPath).href;
        const mod = await dynamicImport(fileUrl);
        return mod.default || mod;
      } catch (e2) {
        logger.error(`Error al importar puppeteer-core: ${e2.message}`);
        return null;
      }
    }
  }
  /**
   * Obtiene y asegura la existencia del directorio de almacenamiento temporal.
   */
  static getStorageDir() {
    const exportsDir = process.env.EXPORTS_DIR
      ? path.resolve(process.cwd(), process.env.EXPORTS_DIR)
      : path.resolve(__dirname, '../../storage/exports');

    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    return exportsDir;
  }

  /**
   * Valida acceso de un usuario a un embudo.
   * @private
   */
  static async _checkFunnelAccess(funnelId, userId, role) {
    const funnel = await FunnelModel.findById(funnelId);
    if (!funnel) {
      const error = new Error(`Embudo con ID ${funnelId} no encontrado`);
      error.statusCode = 404;
      error.code = 'FUNNEL_NOT_FOUND';
      throw error;
    }

    if (role !== 'admin' && funnel.project_owner_id !== userId) {
      const error = new Error('No tienes permiso para operar sobre este embudo');
      error.statusCode = 403;
      error.code = 'FUNNEL_ACCESS_DENIED';
      throw error;
    }

    return funnel;
  }

  /**
   * Exporta el embudo y sus métricas como archivo JSON estándar e importable.
   */
  static async exportToJSON(funnelId, userId, role) {
    const funnel = await this._checkFunnelAccess(funnelId, userId, role);
    const exportRecord = await ExportModel.create({
      funnelId,
      userId,
      format: 'json',
      status: 'processing'
    });

    try {
      const [nodes, connections, metrics, goals] = await Promise.all([
        NodeModel.findByFunnelId(funnelId),
        ConnectionModel.findByFunnelId(funnelId),
        MetricsModel.findByFunnelId(funnelId),
        MetricsModel.findGoalsByFunnelId(funnelId)
      ]);

      const exportData = {
        funnelmapper_version: '1.0',
        exportedAt: new Date().toISOString(),
        funnel: {
          id: funnel.id,
          name: funnel.name,
          description: funnel.description,
          bgColor: funnel.bg_color,
          canvasWidth: funnel.canvas_width,
          canvasHeight: funnel.canvas_height,
          canvasState: funnel.canvas_state,
          nodes,
          connections,
          metrics,
          goals
        }
      };

      const storageDir = this.getStorageDir();
      const filename = `funnel-${funnelId}-${Date.now()}-${crypto.randomUUID().substring(0, 8)}.json`;
      const filePath = path.join(storageDir, filename);

      const content = JSON.stringify(exportData, null, 2);
      fs.writeFileSync(filePath, content, 'utf-8');
      const stats = fs.statSync(filePath);

      const updated = await ExportModel.update(exportRecord.id, {
        status: 'done',
        filePath,
        fileSize: stats.size,
        completedAt: new Date()
      });

      return {
        exportId: updated.id,
        filename,
        fileSize: stats.size,
        format: 'json',
        downloadUrl: `/api/export/download/${updated.id}`
      };
    } catch (error) {
      await ExportModel.update(exportRecord.id, {
        status: 'error',
        errorMsg: error.message
      });
      throw error;
    }
  }

  /**
   * Exporta las métricas consolidadas del embudo a formato CSV.
   */
  static async exportToCSV(funnelId, userId, role) {
    await this._checkFunnelAccess(funnelId, userId, role);
    const exportRecord = await ExportModel.create({
      funnelId,
      userId,
      format: 'csv',
      status: 'processing'
    });

    try {
      const metrics = await MetricsModel.findByFunnelId(funnelId);

      const headers = [
        'node_id',
        'node_label',
        'metric_date',
        'period_type',
        'visitors',
        'unique_visitors',
        'clicks',
        'conversions',
        'conversion_rate',
        'revenue',
        'cost',
        'roi',
        'roas',
        'bounce_rate',
        'avg_time_sec',
        'source',
        'notes'
      ];

      const csvRows = [headers.join(',')];

      metrics.forEach(m => {
        const row = [
          m.node_id,
          `"${(m.node_label || '').replace(/"/g, '""')}"`,
          m.metric_date ? new Date(m.metric_date).toISOString().split('T')[0] : '',
          m.period_type || 'day',
          m.visitors || 0,
          m.unique_visitors || 0,
          m.clicks || 0,
          m.conversions || 0,
          Number(m.conversion_rate || 0).toFixed(2),
          Number(m.revenue || 0).toFixed(2),
          Number(m.cost || 0).toFixed(2),
          Number(m.roi || 0).toFixed(2),
          Number(m.roas || 0).toFixed(2),
          Number(m.bounce_rate || 0).toFixed(2),
          m.avg_time_sec || 0,
          m.source || 'manual',
          `"${(m.notes || '').replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
      });

      const storageDir = this.getStorageDir();
      const filename = `funnel-${funnelId}-metrics-${Date.now()}.csv`;
      const filePath = path.join(storageDir, filename);

      fs.writeFileSync(filePath, csvRows.join('\n'), 'utf-8');
      const stats = fs.statSync(filePath);

      const updated = await ExportModel.update(exportRecord.id, {
        status: 'done',
        filePath,
        fileSize: stats.size,
        completedAt: new Date()
      });

      return {
        exportId: updated.id,
        filename,
        fileSize: stats.size,
        format: 'csv',
        downloadUrl: `/api/export/download/${updated.id}`
      };
    } catch (error) {
      await ExportModel.update(exportRecord.id, {
        status: 'error',
        errorMsg: error.message
      });
      throw error;
    }
  }

  /**
   * Guarda una imagen PNG renderizada a alta resolución desde el cliente o genera una desde el canvas.
   */
  static async exportToPNG(funnelId, userId, role, base64Image) {
    await this._checkFunnelAccess(funnelId, userId, role);
    const exportRecord = await ExportModel.create({
      funnelId,
      userId,
      format: 'png',
      status: 'processing'
    });

    try {
      if (!base64Image) {
        const error = new Error('No se proporcionó la imagen base64 del canvas');
        error.statusCode = 422;
        error.code = 'IMAGE_REQUIRED';
        throw error;
      }

      // Remover cabecera base64 data:image/png;base64,
      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      const storageDir = this.getStorageDir();
      const filename = `funnel-${funnelId}-${Date.now()}.png`;
      const filePath = path.join(storageDir, filename);

      fs.writeFileSync(filePath, buffer);
      const stats = fs.statSync(filePath);

      const updated = await ExportModel.update(exportRecord.id, {
        status: 'done',
        filePath,
        fileSize: stats.size,
        completedAt: new Date()
      });

      return {
        exportId: updated.id,
        filename,
        fileSize: stats.size,
        format: 'png',
        downloadUrl: `/api/export/download/${updated.id}`
      };
    } catch (error) {
      await ExportModel.update(exportRecord.id, {
        status: 'error',
        errorMsg: error.message
      });
      throw error;
    }
  }

  /**
   * Genera el documento HTML enriquecido para la exportación PDF.
   * @private
   */
  static _generateReportHTML({ funnel, summaryData, flowData, nodes }) {
    const kpis = summaryData.summary;
    const dateFormatted = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const flowRows = (flowData.flow || []).map(step => {
      const badgeClass = step.healthStatus === 'good' ? 'badge-good' : (step.healthStatus === 'warning' ? 'badge-warning' : 'badge-danger');
      return `
        <tr>
          <td><strong>${step.sourceNodeLabel}</strong> → <strong>${step.targetNodeLabel}</strong></td>
          <td>${step.sourceVisitors.toLocaleString()}</td>
          <td>${step.targetVisitors.toLocaleString()}</td>
          <td><span class="badge ${badgeClass}">${step.conversionRate.toFixed(2)}%</span></td>
          <td>${step.dropOffVisitors.toLocaleString()} (${step.dropOffRate.toFixed(2)}%)</td>
        </tr>
      `;
    }).join('');

    const nodeRows = (summaryData.nodes || []).map(n => {
      return `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="width:12px; height:12px; border-radius:3px; background:${n.color || '#3B82F6'}; display:inline-block;"></span>
              <strong>${n.label}</strong>
            </div>
            ${n.sublabel ? `<small style="color:#64748B;">${n.sublabel}</small>` : ''}
          </td>
          <td>${n.visitors.toLocaleString()}</td>
          <td>${n.clicks.toLocaleString()}</td>
          <td>${n.conversions.toLocaleString()}</td>
          <td><strong>${n.conversionRate.toFixed(2)}%</strong></td>
          <td>$${n.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td>$${n.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td>${n.roi > 0 ? `<span style="color:#10B981; font-weight:600;">${n.roi}%</span>` : '0%'}</td>
          <td>${n.roas > 0 ? `${n.roas}x` : '—'}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Embudo — ${funnel.name}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
          body { background: #FFFFFF; color: #0F172A; padding: 30px; font-size: 13px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #E2E8F0; padding-bottom: 20px; margin-bottom: 25px; }
          .brand { font-size: 20px; font-weight: 700; color: #1E293B; }
          .brand span { color: #3B82F6; }
          .funnel-title { font-size: 24px; font-weight: 700; margin-top: 6px; }
          .meta { font-size: 12px; color: #64748B; text-align: right; }
          
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .kpi-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; }
          .kpi-label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748B; margin-bottom: 6px; }
          .kpi-value { font-size: 22px; font-weight: 700; color: #0F172A; }
          .kpi-sub { font-size: 11px; color: #10B981; font-weight: 600; margin-top: 4px; }

          h2 { font-size: 16px; font-weight: 700; margin-bottom: 12px; color: #1E293B; }
          .section { margin-bottom: 30px; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; background: #FFFFFF; }
          th { background: #F1F5F9; color: #475569; font-weight: 600; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #CBD5E1; }
          td { padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 12px; }
          tr:nth-child(even) td { background: #F8FAFC; }

          .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-weight: 600; font-size: 11px; }
          .badge-good { background: #DCFCE7; color: #166534; }
          .badge-warning { background: #FEF9C3; color: #854D0E; }
          .badge-danger { background: #FEE2E2; color: #991B1B; }

          .bottleneck-box { background: #FEF2F2; border-left: 4px solid #EF4444; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px; }
          .bottleneck-title { font-weight: 700; color: #991B1B; margin-bottom: 2px; }
          .bottleneck-desc { color: #7F1D1D; font-size: 12px; }

          .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">FunnelMapper <span>Pro</span></div>
            <div class="funnel-title">${funnel.name}</div>
            <p style="color:#64748B; margin-top:4px;">${funnel.description || 'Reporte ejecutivo de rendimiento y analítica de conversión'}</p>
          </div>
          <div class="meta">
            <div>Fecha de emisión: <strong>${dateFormatted}</strong></div>
            <div style="margin-top:4px;">Nodos activos: <strong>${nodes.length}</strong></div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Visitantes Totales</div>
            <div class="kpi-value">${kpis.totalVisitors.toLocaleString()}</div>
            <div class="kpi-sub">${kpis.totalUniqueVisitors.toLocaleString()} únicos</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Conversiones</div>
            <div class="kpi-value">${kpis.totalConversions.toLocaleString()}</div>
            <div class="kpi-sub">Tasa: ${kpis.overallConversionRate.toFixed(2)}%</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Ingresos Totales</div>
            <div class="kpi-value">$${kpis.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div class="kpi-sub">Costo: $${kpis.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Retorno (ROI / ROAS)</div>
            <div class="kpi-value">${kpis.roi > 0 ? `${kpis.roi}%` : '—'}</div>
            <div class="kpi-sub">ROAS: ${kpis.roas > 0 ? `${kpis.roas}x` : '—'}</div>
          </div>
        </div>

        ${flowData.bottleneck ? `
          <div class="bottleneck-box">
            <div class="bottleneck-title">⚠️ Cuello de botella detectado en el embudo</div>
            <div class="bottleneck-desc">
              Paso de mayor caída: <strong>${flowData.bottleneck.sourceNodeLabel} → ${flowData.bottleneck.targetNodeLabel}</strong> 
              con una tasa de paso de solo <strong>${flowData.bottleneck.conversionRate.toFixed(2)}%</strong> 
              (${flowData.bottleneck.dropOffVisitors.toLocaleString()} visitantes perdidos).
            </div>
          </div>
        ` : ''}

        <div class="section">
          <h2>Flujo de Conversión Nodo a Nodo</h2>
          <table>
            <thead>
              <tr>
                <th>Conexión</th>
                <th>Visitantes Origen</th>
                <th>Visitantes Destino</th>
                <th>Tasa de Paso</th>
                <th>Caída (Drop-off)</th>
              </tr>
            </thead>
            <tbody>
              ${flowRows || '<tr><td colspan="5" style="text-align:center;">Sin conexiones configuradas</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Métricas Detalladas por Nodo</h2>
          <table>
            <thead>
              <tr>
                <th>Nodo</th>
                <th>Visitas</th>
                <th>Clics</th>
                <th>Convs</th>
                <th>Conv %</th>
                <th>Revenue</th>
                <th>Costo</th>
                <th>ROI</th>
                <th>ROAS</th>
              </tr>
            </thead>
            <tbody>
              ${nodeRows}
            </tbody>
          </table>
        </div>

        <div class="footer" id="canvas-ready">
          Generado automáticamente por FunnelMapper Pro — Plataforma de Arquitectura y Rendimiento de Embudos de Venta.
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Genera un reporte PDF con Puppeteer a partir de los datos del embudo.
   */
  static async exportToPDF(funnelId, userId, role) {
    const funnel = await this._checkFunnelAccess(funnelId, userId, role);
    const exportRecord = await ExportModel.create({
      funnelId,
      userId,
      format: 'pdf',
      status: 'processing'
    });

    try {
      const [summaryData, flowData, nodes] = await Promise.all([
        AnalyticsService.getFunnelSummary(funnelId, {}, userId, role),
        AnalyticsService.getConversionFlow(funnelId, {}, userId, role),
        NodeModel.findByFunnelId(funnelId)
      ]);

      const htmlContent = this._generateReportHTML({
        funnel,
        summaryData,
        flowData,
        nodes
      });

      const storageDir = this.getStorageDir();
      const filename = `funnel-${funnelId}-report-${Date.now()}.pdf`;
      const filePath = path.join(storageDir, filename);

      const chromiumPath = process.env.CHROMIUM_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

      const puppeteerInstance = await this._getPuppeteer();
      if (!puppeteerInstance) {
        throw new Error('Puppeteer no está configurado en el servidor');
      }

      const browser = await puppeteerInstance.launch({
        executablePath: fs.existsSync(chromiumPath) ? chromiumPath : undefined,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
      });

      try {
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#canvas-ready', { timeout: 10000 });

        const pdfBuffer = await page.pdf({
          format: 'A3',
          landscape: true,
          printBackground: true,
          margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });

        fs.writeFileSync(filePath, pdfBuffer);
      } finally {
        await browser.close();
      }

      const stats = fs.statSync(filePath);

      const updated = await ExportModel.update(exportRecord.id, {
        status: 'done',
        filePath,
        fileSize: stats.size,
        completedAt: new Date()
      });

      return {
        exportId: updated.id,
        filename,
        fileSize: stats.size,
        format: 'pdf',
        downloadUrl: `/api/export/download/${updated.id}`
      };
    } catch (error) {
      logger.error(`Error generando PDF con Puppeteer: ${error.message}`);
      await ExportModel.update(exportRecord.id, {
        status: 'error',
        errorMsg: error.message
      });
      throw error;
    }
  }

  /**
   * Obtiene la ruta física del archivo exportado para streaming y descarga.
   */
  static async getExportFile(exportId, userId, role) {
    const exportRecord = await ExportModel.findById(exportId);
    if (!exportRecord) {
      const error = new Error(`Exportación con ID ${exportId} no encontrada`);
      error.statusCode = 404;
      error.code = 'EXPORT_NOT_FOUND';
      throw error;
    }

    await this._checkFunnelAccess(exportRecord.funnel_id, userId, role);

    if (exportRecord.status !== 'done' || !exportRecord.file_path) {
      const error = new Error('La exportación aún no se ha completado o presentó un error');
      error.statusCode = 400;
      error.code = 'EXPORT_NOT_READY';
      throw error;
    }

    if (!fs.existsSync(exportRecord.file_path)) {
      const error = new Error('El archivo solicitado ha expirado o ya no existe en el servidor');
      error.statusCode = 404;
      error.code = 'FILE_EXPIRED';
      throw error;
    }

    const mimeTypes = {
      json: 'application/json',
      csv: 'text/csv',
      png: 'image/png',
      pdf: 'application/pdf'
    };

    return {
      exportRecord,
      filePath: exportRecord.file_path,
      filename: path.basename(exportRecord.file_path),
      mimeType: mimeTypes[exportRecord.format] || 'application/octet-stream'
    };
  }

  /**
   * Obtiene el historial de exportaciones de un embudo.
   */
  static async getFunnelExportHistory(funnelId, userId, role) {
    await this._checkFunnelAccess(funnelId, userId, role);
    return await ExportModel.findByFunnelId(funnelId);
  }

  /**
   * Limpia archivos de exportación con más de N horas (seguridad y espacio en disco).
   */
  static async cleanupOldExports(hoursOld = 1) {
    const oldExports = await ExportModel.getOldExports(hoursOld);
    let deletedFiles = 0;

    for (const exp of oldExports) {
      if (exp.file_path && fs.existsSync(exp.file_path)) {
        try {
          fs.unlinkSync(exp.file_path);
          deletedFiles++;
        } catch (e) {
          logger.warn(`No se pudo eliminar archivo antiguo: ${exp.file_path}`);
        }
      }
    }

    logger.info(`Limpieza de exportaciones completada: ${deletedFiles} archivos eliminados`);
    return { cleanedRecords: oldExports.length, deletedFiles };
  }
}

module.exports = ExportService;
