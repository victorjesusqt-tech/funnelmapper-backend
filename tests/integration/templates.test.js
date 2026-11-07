const request = require('supertest');
const app = require('../../src/config/app');
const pool = require('../../src/config/database');

describe('Templates API Integration Tests', () => {
  let editorToken = '';
  let otherToken = '';
  let editorProjectId = null;
  let testTemplateId = null;

  beforeAll(async () => {
    const timestamp = Date.now();

    // 1. Crear usuario editor 1
    const editorRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Template Editor',
        email: `tpl_editor_${timestamp}@example.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
    editorToken = editorRes.body.data.accessToken;

    // 2. Crear usuario editor 2
    const otherRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Other Editor',
        email: `tpl_other_${timestamp}@example.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
    otherToken = otherRes.body.data.accessToken;

    // 3. Crear proyecto del editor 1
    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        name: 'Proyecto Para Plantillas',
        description: 'Proyecto de prueba para clonar plantillas',
        color: '#10B981'
      });
    editorProjectId = projectRes.body.data.id;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/templates', () => {
    it('debe rechazar la petición sin token con código 401', async () => {
      const res = await request(app).get('/api/templates');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('debe listar las plantillas públicas paginadas con código 200 (10 plantillas)', async () => {
      const res = await request(app)
        .get('/api/templates?page=1&limit=10')
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(10);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(10);

      testTemplateId = res.body.data.items[0].id;
    });

    it('debe permitir buscar por texto (?search=Leads)', async () => {
      const res = await request(app)
        .get('/api/templates?search=Leads')
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/templates/featured', () => {
    it('debe retornar la lista de plantillas destacadas con código 200', async () => {
      const res = await request(app)
        .get('/api/templates/featured')
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach(t => {
        expect(t.is_featured).toBe(1);
      });
    });
  });

  describe('GET /api/templates/category/:cat', () => {
    it('debe filtrar plantillas por categoría (ecommerce)', async () => {
      const res = await request(app)
        .get('/api/templates/category/ecommerce')
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      res.body.data.items.forEach(t => {
        expect(t.category).toBe('ecommerce');
      });
    });
  });

  describe('GET /api/templates/:id', () => {
    it('debe retornar el detalle de la plantilla con canvas_data deserializado', async () => {
      const res = await request(app)
        .get(`/api/templates/${testTemplateId}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testTemplateId);
      expect(res.body.data.canvas_data).toBeDefined();
      expect(typeof res.body.data.canvas_data).toBe('object');
      expect(Array.isArray(res.body.data.canvas_data.nodes)).toBe(true);
    });

    it('debe retornar 404 si la plantilla no existe', async () => {
      const res = await request(app)
        .get('/api/templates/999999')
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TEMPLATE_NOT_FOUND');
    });
  });

  describe('POST /api/templates/:id/use', () => {
    it('debe crear un nuevo embudo en el proyecto a partir de la plantilla (código 201)', async () => {
      const res = await request(app)
        .post(`/api/templates/${testTemplateId}/use`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          projectId: editorProjectId,
          name: 'Mi Embudo Basado en Plantilla'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.project_id).toBe(editorProjectId);
      expect(res.body.data.name).toBe('Mi Embudo Basado en Plantilla');
      expect(res.body.data.node_count).toBeGreaterThan(0);
    });

    it('debe rechazar la petición si falta projectId con código 422', async () => {
      const res = await request(app)
        .post(`/api/templates/${testTemplateId}/use`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          name: 'Embudo Sin Proyecto'
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('debe rechazar si el usuario intenta agregar un embudo a un proyecto ajeno (código 403)', async () => {
      const res = await request(app)
        .post(`/api/templates/${testTemplateId}/use`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          projectId: editorProjectId,
          name: 'Intento de Invasión'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PROJECT_ACCESS_DENIED');
    });
  });
});
