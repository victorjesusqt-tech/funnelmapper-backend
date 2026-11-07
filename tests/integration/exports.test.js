const request = require('supertest');
const fs = require('fs');
const app = require('../../src/config/app');
const pool = require('../../src/config/database');
const NodeModel = require('../../src/models/nodeModel');
const ConnectionModel = require('../../src/models/connectionModel');

describe('CSV Import & Exports API Integration Tests', () => {
  let editorToken = '';
  let otherToken = '';
  let editorProjectId = null;
  let funnelId = null;
  let nodeA = null;
  let nodeB = null;
  let jsonExportId = null;
  let csvExportId = null;

  beforeAll(async () => {
    const timestamp = Date.now();

    // 1. Crear usuario editor
    const editorRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Export Editor',
        email: `exp_editor_${timestamp}@example.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
    editorToken = editorRes.body.data.accessToken;

    // 2. Crear usuario ajeno
    const otherRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Export Other',
        email: `exp_other_${timestamp}@example.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
    otherToken = otherRes.body.data.accessToken;

    // 3. Crear proyecto
    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        name: 'Proyecto Exportaciones',
        description: 'Proyecto para pruebas de export e importación'
      });
    editorProjectId = projectRes.body.data.id;

    // 4. Crear embudo
    const funnelRes = await request(app)
      .post('/api/funnels')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        projectId: editorProjectId,
        name: 'Embudo de Prueba Export',
        description: 'Embudo de prueba'
      });
    funnelId = funnelRes.body.data.id;

    // 5. Crear 2 nodos
    nodeA = await NodeModel.create({
      funnelId,
      label: 'Landing Page',
      posX: 100,
      posY: 100
    });

    nodeB = await NodeModel.create({
      funnelId,
      label: 'Checkout',
      posX: 400,
      posY: 100
    });

    // 6. Conexión
    await ConnectionModel.create({
      funnelId,
      sourceNodeId: nodeA.id,
      targetNodeId: nodeB.id
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/metrics/funnel/:funnelId/import-csv', () => {
    it('debe rechazar la importación sin token (código 401)', async () => {
      const res = await request(app)
        .post(`/api/metrics/funnel/${funnelId}/import-csv`)
        .send({ csvData: 'node_label,metric_date\nLanding Page,2026-10-01' });

      expect(res.status).toBe(401);
    });

    it('debe rechazar si no se envía contenido CSV (código 422)', async () => {
      const res = await request(app)
        .post(`/api/metrics/funnel/${funnelId}/import-csv`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({});

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('CSV_REQUIRED');
    });

    it('debe denegar acceso a un usuario ajeno (código 403)', async () => {
      const res = await request(app)
        .post(`/api/metrics/funnel/${funnelId}/import-csv`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          csvData: 'node_label,metric_date,visitors\nLanding Page,2026-10-01,1000'
        });

      expect(res.status).toBe(403);
    });

    it('debe importar métricas válidas desde CSV de texto plano (código 200)', async () => {
      const csv = [
        'node_label,metric_date,visitors,unique_visitors,clicks,conversions,revenue,cost,bounce_rate,avg_time_sec',
        'Landing Page,2026-10-01,5000,4200,4200,1200,3600.00,800.00,35.5,45',
        'Checkout,2026-10-01,1200,1200,1000,450,13500.00,0,18.3,240',
        'Nodo Inexistente,2026-10-01,100,100,50,10,0,0,10,20'
      ].join('\n');

      const res = await request(app)
        .post(`/api/metrics/funnel/${funnelId}/import-csv`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ csvData: csv });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.imported).toBe(2);
      expect(res.body.data.skipped).toBe(1); // El nodo inexistente se omite
      expect(res.body.data.errors.length).toBe(1);
    });
  });

  describe('POST /api/export/funnel/:id/json', () => {
    it('debe exportar el estado completo del embudo como archivo JSON (código 200)', async () => {
      const res = await request(app)
        .post(`/api/export/funnel/${funnelId}/json`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.format).toBe('json');
      expect(res.body.data.exportId).toBeDefined();
      expect(res.body.data.downloadUrl).toContain('/api/export/download/');

      jsonExportId = res.body.data.exportId;
    });
  });

  describe('POST /api/export/funnel/:id/csv', () => {
    it('debe exportar las métricas históricas del embudo como CSV (código 200)', async () => {
      const res = await request(app)
        .post(`/api/export/funnel/${funnelId}/csv`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.format).toBe('csv');
      expect(res.body.data.exportId).toBeDefined();

      csvExportId = res.body.data.exportId;
    });
  });

  describe('POST /api/export/funnel/:id/png', () => {
    it('debe guardar imagen PNG enviada en base64 (código 200)', async () => {
      // 1x1 transparente PNG base64
      const samplePng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const res = await request(app)
        .post(`/api/export/funnel/${funnelId}/png`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ imageData: samplePng });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.format).toBe('png');
    });

    it('debe rechazar la exportación PNG si no se envía la imagen (código 422)', async () => {
      const res = await request(app)
        .post(`/api/export/funnel/${funnelId}/png`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({});

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/export/funnel/:id/pdf', () => {
    it('debe generar el reporte ejecutivo PDF con Puppeteer (código 200)', async () => {
      const res = await request(app)
        .post(`/api/export/funnel/${funnelId}/pdf`)
        .set('Authorization', `Bearer ${editorToken}`);

      // Puppeteer corre con Google Chrome en Windows
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.format).toBe('pdf');
      expect(res.body.data.fileSize).toBeGreaterThan(0);
    }, 25000); // 25s timeout para lanzamiento headless
  });

  describe('GET /api/export/download/:exportId', () => {
    it('debe permitir la descarga física del archivo exportado (código 200)', async () => {
      const res = await request(app)
        .get(`/api/export/download/${jsonExportId}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/json');

      const parsed = JSON.parse(res.text);
      expect(parsed.funnelmapper_version).toBe('1.0');
      expect(parsed.funnel.id).toBe(funnelId);
      expect(parsed.funnel.name).toBe('Embudo de Prueba Export');
    });

    it('debe retornar 404 si el archivo de exportación no existe', async () => {
      const res = await request(app)
        .get('/api/export/download/999999')
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/export/funnel/:id/history', () => {
    it('debe obtener la lista histórica de exportaciones del embudo (código 200)', async () => {
      const res = await request(app)
        .get(`/api/export/funnel/${funnelId}/history`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });
});

