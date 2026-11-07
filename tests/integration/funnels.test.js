const request = require('supertest');
const app = require('../../src/config/app');
const pool = require('../../src/config/database');

describe('Funnels API Integration Tests', () => {
  let editorToken = '';
  let otherToken = '';
  let editorProjectId = null;
  let otherProjectId = null;
  let createdFunnelId = null;

  beforeAll(async () => {
    const timestamp = Date.now();

    // 1. Crear usuario editor 1
    const editorRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Funnel Editor',
        email: `fn_editor_${timestamp}@example.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
    editorToken = editorRes.body.data.accessToken;

    // 2. Crear usuario editor 2
    const otherRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Funnel Other',
        email: `fn_other_${timestamp}@example.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
    otherToken = otherRes.body.data.accessToken;

    // 3. Crear proyecto para editor 1
    const p1Res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        name: 'Proyecto Principal Embudos',
        description: 'Proyecto para pruebas de embudos'
      });
    editorProjectId = p1Res.body.data.id;

    // 4. Crear proyecto para editor 2
    const p2Res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        name: 'Proyecto Ajeno',
        description: 'Proyecto de otro usuario'
      });
    otherProjectId = p2Res.body.data.id;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/funnels', () => {
    it('debe rechazar la creación de embudo sin token (código 401)', async () => {
      const res = await request(app)
        .post('/api/funnels')
        .send({
          projectId: editorProjectId,
          name: 'Embudo No Autorizado'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('debe crear un nuevo embudo en blanco con código 201', async () => {
      const res = await request(app)
        .post('/api/funnels')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          projectId: editorProjectId,
          name: 'Embudo de Captura B2B',
          description: 'Flujo de registro para clientes corporativos',
          bgColor: '#FFFFFF'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('Embudo de Captura B2B');
      expect(res.body.data.project_id).toBe(editorProjectId);
      expect(res.body.data.status).toBe('draft');

      createdFunnelId = res.body.data.id;
    });

    it('debe rechazar nombres demasiado cortos (< 2 chars) con código 422', async () => {
      const res = await request(app)
        .post('/api/funnels')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          projectId: editorProjectId,
          name: 'A'
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('debe rechazar si falta projectId con código 422', async () => {
      const res = await request(app)
        .post('/api/funnels')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          name: 'Embudo Huérfano'
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('debe rechazar si se intenta crear en un proyecto ajeno privado (código 403)', async () => {
      const res = await request(app)
        .post('/api/funnels')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          projectId: otherProjectId,
          name: 'Intento de Invasión de Embudo'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PROJECT_ACCESS_DENIED');
    });
  });

  describe('GET /api/funnels/project/:projectId', () => {
    it('debe listar los embudos del proyecto propio con código 200', async () => {
      const res = await request(app)
        .get(`/api/funnels/project/${editorProjectId}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].id).toBe(createdFunnelId);
    });

    it('debe rechazar la consulta de embudos de un proyecto ajeno privado con código 403', async () => {
      const res = await request(app)
        .get(`/api/funnels/project/${otherProjectId}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PROJECT_ACCESS_DENIED');
    });
  });

  describe('GET /api/funnels/:id', () => {
    it('debe retornar el detalle del embudo con arrays de nodos y conexiones (código 200)', async () => {
      const res = await request(app)
        .get(`/api/funnels/${createdFunnelId}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdFunnelId);
      expect(Array.isArray(res.body.data.nodes)).toBe(true);
      expect(Array.isArray(res.body.data.connections)).toBe(true);
    });

    it('debe rechazar el acceso a un embudo ajeno con código 403', async () => {
      const res = await request(app)
        .get(`/api/funnels/${createdFunnelId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FUNNEL_ACCESS_DENIED');
    });

    it('debe retornar 404 si el embudo no existe', async () => {
      const res = await request(app)
        .get('/api/funnels/999999')
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FUNNEL_NOT_FOUND');
    });
  });

  describe('PUT /api/funnels/:id', () => {
    it('debe actualizar metadatos y estado del canvas incrementando versión (código 200)', async () => {
      const res = await request(app)
        .put(`/api/funnels/${createdFunnelId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          name: 'Embudo de Captura B2B Actualizado',
          bgColor: '#E2E8F0',
          canvasState: {
            nodes: [{ id: 1, label: 'Inicio' }],
            connections: []
          },
          nodeCount: 1
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Embudo de Captura B2B Actualizado');
      expect(res.body.data.bg_color).toBe('#E2E8F0');
      expect(res.body.data.version).toBeGreaterThan(1);
    });
  });

  describe('POST /api/funnels/:id/duplicate', () => {
    it('debe duplicar el embudo completo con nuevo nombre y código 201', async () => {
      const res = await request(app)
        .post(`/api/funnels/${createdFunnelId}/duplicate`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          name: 'Copia de Embudo B2B'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.id).not.toBe(createdFunnelId);
      expect(res.body.data.name).toBe('Copia de Embudo B2B');
      expect(res.body.data.project_id).toBe(editorProjectId);
    });
  });

  describe('Canvas State & Versions API (/api/funnels/:id/canvas)', () => {
    it('debe guardar el estado completo del canvas (POST /canvas) con código 200 e incrementar versión', async () => {
      const mockCanvasState = {
        version: '1.0',
        savedAt: new Date().toISOString(),
        viewport: { zoomLevel: 1.25, panX: 120, panY: 60 },
        settings: { gridEnabled: true, gridSize: 20, snapToGrid: true, bgColor: '#F8FAFC' },
        nodes: [
          { id: 'n1', label: 'Facebook Ads', posX: 100, posY: 100, width: 175, height: 75, color: '#1877F2' },
          { id: 'n2', label: 'Landing Page', posX: 350, posY: 100, width: 175, height: 75, color: '#10B981' }
        ],
        connections: [
          { id: 'c1', sourceNodeId: 'n1', targetNodeId: 'n2', sourceHandle: 'right', targetHandle: 'left', color: '#94A3B8' }
        ]
      };

      const res = await request(app)
        .post(`/api/funnels/${createdFunnelId}/canvas`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          canvasState: mockCanvasState,
          notes: 'Guardado inicial de prueba de canvas'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.funnelId).toBe(createdFunnelId);
      expect(res.body.data.version).toBeGreaterThanOrEqual(2);
      expect(res.body.data.canvasState).toBeDefined();
      expect(res.body.data.canvasState.nodes).toHaveLength(2);
    });

    it('debe obtener el estado guardado del canvas (GET /canvas) con código 200', async () => {
      const res = await request(app)
        .get(`/api/funnels/${createdFunnelId}/canvas`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.funnelId).toBe(createdFunnelId);
      expect(res.body.data.canvasState.nodes).toHaveLength(2);
      expect(res.body.data.canvasState.connections).toHaveLength(1);
    });

    it('debe listar el historial de versiones guardadas (GET /versions)', async () => {
      const res = await request(app)
        .get(`/api/funnels/${createdFunnelId}/versions`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].version).toBeDefined();
    });

    it('debe restaurar una versión previa desde el historial (POST /restore/:v)', async () => {
      // 1. Obtener versiones
      const verRes = await request(app)
        .get(`/api/funnels/${createdFunnelId}/versions`)
        .set('Authorization', `Bearer ${editorToken}`);
      const targetVersion = verRes.body.data[0].version;

      // 2. Restaurar esa versión
      const res = await request(app)
        .post(`/api/funnels/${createdFunnelId}/restore/${targetVersion}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.restoredFromVersion).toBe(targetVersion);
    });
  });

  describe('DELETE /api/funnels/:id', () => {
    it('debe eliminar el embudo y retornar código 200', async () => {
      const res = await request(app)
        .delete(`/api/funnels/${createdFunnelId}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verificar que ya no existe
      const verifyRes = await request(app)
        .get(`/api/funnels/${createdFunnelId}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(verifyRes.status).toBe(404);
    });

    it('debe rechazar la eliminación si el usuario no es propietario ni admin (código 403)', async () => {
      // 1. Crear embudo en el proyecto del editor 2
      const f2Res = await request(app)
        .post('/api/funnels')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          projectId: otherProjectId,
          name: 'Embudo de Other'
        });
      const otherFunnelId = f2Res.body.data.id;

      // 2. Editor 1 intenta eliminar el embudo de Editor 2
      const res = await request(app)
        .delete(`/api/funnels/${otherFunnelId}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FUNNEL_ACCESS_DENIED');
    });
  });
});
