const request = require('supertest');
const app = require('../../src/config/app');
const pool = require('../../src/config/database');
const NodeModel = require('../../src/models/nodeModel');
const ConnectionModel = require('../../src/models/connectionModel');

describe('Metrics & Analytics API Integration Tests', () => {
  let editorToken = '';
  let otherToken = '';
  let editorProjectId = null;
  let funnelId = null;
  let nodeAId = null;
  let nodeBId = null;
  let nodeCId = null;
  let connectionABId = null;
  let connectionBCId = null;
  let createdMetricId = null;

  beforeAll(async () => {
    const timestamp = Date.now();

    // 1. Crear usuario editor principal
    const editorRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Analytics Editor',
        email: `analytics_ed_${timestamp}@example.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
    editorToken = editorRes.body.data.accessToken;

    // 2. Crear usuario ajeno
    const otherRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Analytics Other',
        email: `analytics_ot_${timestamp}@example.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
    otherToken = otherRes.body.data.accessToken;

    // 3. Crear proyecto para el editor
    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        name: 'Proyecto Analytics Test',
        description: 'Proyecto de prueba para métricas y flujo de conversión'
      });
    editorProjectId = projectRes.body.data.id;

    // 4. Crear embudo
    const funnelRes = await request(app)
      .post('/api/funnels')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        projectId: editorProjectId,
        name: 'Embudo de Ventas Pro',
        description: 'Embudo para pruebas de analítica y ROI'
      });
    funnelId = funnelRes.body.data.id;

    // 5. Crear 3 nodos en BD:
    // Nodo A (Landing) -> Nodo B (Checkout) -> Nodo C (Thank You)
    const nodeA = await NodeModel.create({
      funnelId,
      label: 'Landing Page',
      sublabel: 'Trafico Ads',
      posX: 100,
      posY: 100,
      color: '#3498DB'
    });
    nodeAId = nodeA.id;

    const nodeB = await NodeModel.create({
      funnelId,
      label: 'Checkout Page',
      sublabel: 'Pasarela de pago',
      posX: 350,
      posY: 100,
      color: '#F39C12'
    });
    nodeBId = nodeB.id;

    const nodeC = await NodeModel.create({
      funnelId,
      label: 'Thank You Page',
      sublabel: 'Confirmacion',
      posX: 600,
      posY: 100,
      color: '#2ECC71'
    });
    nodeCId = nodeC.id;

    // 6. Crear 2 conexiones entre los nodos
    const conn1 = await ConnectionModel.create({
      funnelId,
      sourceNodeId: nodeAId,
      targetNodeId: nodeBId,
      label: 'Paso 1'
    });
    connectionABId = conn1.id;

    const conn2 = await ConnectionModel.create({
      funnelId,
      sourceNodeId: nodeBId,
      targetNodeId: nodeCId,
      label: 'Paso 2'
    });
    connectionBCId = conn2.id;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/metrics', () => {
    it('debe rechazar la petición sin token de autenticación (código 401)', async () => {
      const res = await request(app)
        .post('/api/metrics')
        .send({
          nodeId: nodeAId,
          metricDate: '2026-10-01',
          visitors: 1000
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('debe rechazar la petición con campos obligatorios faltantes (código 422)', async () => {
      const res = await request(app)
        .post('/api/metrics')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          visitors: 1000
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('debe denegar el registro de métricas a un usuario ajeno (código 403)', async () => {
      const res = await request(app)
        .post('/api/metrics')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          nodeId: nodeAId,
          metricDate: '2026-10-01',
          visitors: 1000
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FUNNEL_ACCESS_DENIED');
    });

    it('debe registrar métricas exitosamente para Nodo A (código 201)', async () => {
      const res = await request(app)
        .post('/api/metrics')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          nodeId: nodeAId,
          metricDate: '2026-10-01',
          periodType: 'day',
          visitors: 10000,
          uniqueVisitors: 8500,
          clicks: 3000,
          conversions: 2500,
          revenue: 0.00,
          cost: 500.00,
          bounceRate: 35.5,
          avgTimeSec: 65,
          source: 'manual',
          notes: 'Campaña FB Ads inicial'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.node_id).toBe(nodeAId);
      expect(res.body.data.visitors).toBe(10000);
      expect(res.body.data.clicks).toBe(3000);
      expect(res.body.data.conversions).toBe(2500);
      expect(parseFloat(res.body.data.cost)).toBe(500.00);

      // Verificación de columnas calculadas por base de datos
      expect(res.body.data.conversion_rate).toBeCloseTo(25.0, 1);

      createdMetricId = res.body.data.id;
    });

    it('debe realizar UPSERT actualizando el registro si coincide nodo, fecha y periodo', async () => {
      const res = await request(app)
        .post('/api/metrics')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          nodeId: nodeAId,
          metricDate: '2026-10-01',
          periodType: 'day',
          visitors: 10000,
          uniqueVisitors: 9000,
          clicks: 3200,
          conversions: 2500,
          revenue: 0.00,
          cost: 500.00,
          bounceRate: 32.0,
          avgTimeSec: 70
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe(createdMetricId);
      expect(res.body.data.unique_visitors).toBe(9000);
      expect(res.body.data.clicks).toBe(3200);
    });

    it('debe registrar métricas para Nodo B (Checkout) con ingresos', async () => {
      const res = await request(app)
        .post('/api/metrics')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          nodeId: nodeBId,
          metricDate: '2026-10-01',
          periodType: 'day',
          visitors: 2500,
          uniqueVisitors: 2300,
          clicks: 1200,
          conversions: 800,
          revenue: 2000.00,
          cost: 0.00,
          bounceRate: 15.0,
          avgTimeSec: 140
        });

      expect(res.status).toBe(201);
      expect(res.body.data.visitors).toBe(2500);
      expect(parseFloat(res.body.data.revenue)).toBe(2000.00);
    });

    it('debe registrar métricas para Nodo C (Thank You) con visitantes', async () => {
      const res = await request(app)
        .post('/api/metrics')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          nodeId: nodeCId,
          metricDate: '2026-10-01',
          periodType: 'day',
          visitors: 200,
          uniqueVisitors: 200,
          clicks: 50,
          conversions: 200,
          revenue: 0.00,
          cost: 0.00,
          bounceRate: 5.0,
          avgTimeSec: 45
        });

      expect(res.status).toBe(201);
      expect(res.body.data.visitors).toBe(200);
    });
  });

  describe('GET /api/metrics/node/:nodeId', () => {
    it('debe obtener el historial de métricas de un nodo con filtros (código 200)', async () => {
      const res = await request(app)
        .get(`/api/metrics/node/${nodeAId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .query({ periodType: 'day' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].node_id).toBe(nodeAId);
    });

    it('debe rechazar la consulta si el usuario no tiene acceso al embudo (código 403)', async () => {
      const res = await request(app)
        .get(`/api/metrics/node/${nodeAId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/metrics/:id', () => {
    it('debe actualizar campos específicos de un registro de métricas (código 200)', async () => {
      const res = await request(app)
        .put(`/api/metrics/${createdMetricId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          cost: 600.00,
          notes: 'Costo actualizado de anuncios'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(parseFloat(res.body.data.cost)).toBe(600.00);
      expect(res.body.data.notes).toBe('Costo actualizado de anuncios');

      // Restaurar costo a 500 para cálculos posteriores
      await request(app)
        .put(`/api/metrics/${createdMetricId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ cost: 500.00 });
    });

    it('debe impedir que un usuario ajeno modifique las métricas (código 403)', async () => {
      const res = await request(app)
        .put(`/api/metrics/${createdMetricId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          cost: 999.00
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/metrics/funnel/:funnelId', () => {
    it('debe listar todas las métricas registradas en el embudo (código 200)', async () => {
      const res = await request(app)
        .get(`/api/metrics/funnel/${funnelId}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(3); // Nodos A, B y C
      expect(res.body.data[0]).toHaveProperty('node_label');
    });
  });

  describe('GET /api/metrics/funnel/:funnelId/summary', () => {
    it('debe calcular KPIs consolidados del embudo: Totales, ROI, ROAS, CPC, CPA (código 200)', async () => {
      const res = await request(app)
        .get(`/api/metrics/funnel/${funnelId}/summary`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const summary = res.body.data.summary;
      expect(summary).toBeDefined();

      // Total visitantes = 10,000 + 2,500 + 200 = 12,700
      expect(summary.totalVisitors).toBe(12700);

      // Total conversiones = 2,500 + 800 + 200 = 3,500
      expect(summary.totalConversions).toBe(3500);

      // Costo total = $500, Ingresos totales = $2,000
      expect(summary.totalCost).toBe(500);
      expect(summary.totalRevenue).toBe(2000);

      // ROI = ((2000 - 500) / 500) * 100 = 300%
      expect(summary.roi).toBe(300);

      // ROAS = 2000 / 500 = 4.0
      expect(summary.roas).toBe(4.0);

      // CPC = Costo total / Clics totales = 500 / (3200 + 1200 + 50 = 4450)
      expect(summary.cpc).toBeCloseTo(0.11, 2);

      // CPA = Costo total / Conversiones totales = 500 / 3500 = 0.14
      expect(summary.cpa).toBeCloseTo(0.14, 2);

      // Desglose de nodos
      expect(Array.isArray(res.body.data.nodes)).toBe(true);
      expect(res.body.data.nodes.length).toBe(3);

      const nodeASummary = res.body.data.nodes.find(n => n.nodeId === nodeAId);
      expect(nodeASummary.visitors).toBe(10000);
      expect(nodeASummary.conversionRate).toBe(25.0);
    });
  });

  describe('GET /api/metrics/funnel/:funnelId/conversion-flow', () => {
    it('debe calcular tasas de conversión nodo a nodo y detectar cuellos de botella (código 200)', async () => {
      const res = await request(app)
        .get(`/api/metrics/funnel/${funnelId}/conversion-flow`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const flow = res.body.data.flow;
      expect(Array.isArray(flow)).toBe(true);
      expect(flow.length).toBe(2);

      // Paso 1: Nodo A (10,000) -> Nodo B (2,500) = 25.00%
      const step1 = flow.find(f => f.sourceNodeId === nodeAId && f.targetNodeId === nodeBId);
      expect(step1).toBeDefined();
      expect(step1.sourceVisitors).toBe(10000);
      expect(step1.targetVisitors).toBe(2500);
      expect(step1.conversionRate).toBe(25.0);
      expect(step1.dropOffVisitors).toBe(7500);
      expect(step1.dropOffRate).toBe(75.0);
      expect(step1.healthStatus).toBe('good'); // >= 20%

      // Paso 2: Nodo B (2,500) -> Nodo C (200) = (200 / 2500) * 100 = 8.00%
      const step2 = flow.find(f => f.sourceNodeId === nodeBId && f.targetNodeId === nodeCId);
      expect(step2).toBeDefined();
      expect(step2.sourceVisitors).toBe(2500);
      expect(step2.targetVisitors).toBe(200);
      expect(step2.conversionRate).toBe(8.0);
      expect(step2.dropOffVisitors).toBe(2300);
      expect(step2.dropOffRate).toBe(92.0);
      expect(step2.healthStatus).toBe('critical'); // < 10%

      // Cuello de botella detectado debe ser el paso 2
      expect(res.body.data.bottleneck).toBeDefined();
      expect(res.body.data.bottleneck.sourceNodeId).toBe(nodeBId);
      expect(res.body.data.bottleneck.targetNodeId).toBe(nodeCId);
      expect(res.body.data.bottleneck.conversionRate).toBe(8.0);
    });
  });

  describe('Sistema de Objetivos (metric_goals)', () => {
    it('debe configurar objetivos para Nodo B (código 201)', async () => {
      const res = await request(app)
        .post(`/api/metrics/node/${nodeBId}/goals`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          goalVisitors: 5000,
          goalConversions: 1500,
          goalRevenue: 5000.00,
          goalConvRate: 30.0,
          goalRoas: 5.0,
          period: 'monthly'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.node_id).toBe(nodeBId);
      expect(res.body.data.goal_visitors).toBe(5000);
      expect(res.body.data.period).toBe('monthly');
    });

    it('debe obtener los objetivos de un nodo (código 200)', async () => {
      const res = await request(app)
        .get(`/api/metrics/node/${nodeBId}/goals`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].goal_visitors).toBe(5000);
    });

    it('debe obtener todos los objetivos del embudo (código 200)', async () => {
      const res = await request(app)
        .get(`/api/metrics/funnel/${funnelId}/goals`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0]).toHaveProperty('node_label');
    });
  });

  describe('DELETE /api/metrics/:id', () => {
    it('debe eliminar un registro de métricas exitosamente (código 200)', async () => {
      const res = await request(app)
        .delete(`/api/metrics/${createdMetricId}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdMetricId);

      // Verificar que ya no existe (404)
      const checkRes = await request(app)
        .delete(`/api/metrics/${createdMetricId}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(checkRes.status).toBe(404);
    });
  });
});
