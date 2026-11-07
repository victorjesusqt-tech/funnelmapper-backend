const request = require('supertest');
const app = require('../../src/config/app');
const pool = require('../../src/config/database');

describe('Projects API Integration Tests', () => {
  let editorToken = '';
  let otherToken = '';
  let adminToken = '';
  let projectId = null;

  beforeAll(async () => {
    const timestamp = Date.now();

    // 1. Crear usuario editor
    const editorRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Editor Uno',
        email: `editor_${timestamp}@example.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
    editorToken = editorRes.body.data.accessToken;

    // 2. Crear segundo usuario editor
    const otherRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Editor Dos',
        email: `other_${timestamp}@example.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
    otherToken = otherRes.body.data.accessToken;

    // 3. Login como admin (creado en seeds)
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@funnelmapper.local',
        password: 'Admin123!'
      });
    adminToken = adminRes.body.data.accessToken;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/projects', () => {
    it('debe crear un nuevo proyecto con código 201 (rol editor)', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          name: 'Embudo de Ventas Principal',
          description: 'Embudo para captación B2B',
          color: '#10B981',
          is_public: false
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Embudo de Ventas Principal');
      expect(res.body.data.color).toBe('#10B981');

      projectId = res.body.data.id;
    });

    it('debe rechazar la creación de proyecto sin token con código 401', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({
          name: 'Proyecto No Autorizado'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('debe rechazar nombres demasiado cortos (< 3 chars) con código 422', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          name: 'AB'
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/projects', () => {
    it('debe listar los proyectos del usuario paginados con código 200', async () => {
      const res = await request(app)
        .get('/api/projects?page=1&limit=10')
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('debe retornar los detalles del proyecto propio con código 200', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(projectId);
    });

    it('debe rechazar el acceso a un proyecto ajeno privado con código 403', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PROJECT_ACCESS_DENIED');
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('debe actualizar los datos del proyecto con código 200', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          name: 'Embudo de Ventas Actualizado',
          color: '#3B82F6'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Embudo de Ventas Actualizado');
      expect(res.body.data.color).toBe('#3B82F6');
    });
  });

  describe('PATCH /api/projects/:id/archive', () => {
    it('debe archivar y desarchivar el proyecto con código 200', async () => {
      const resArchive = await request(app)
        .patch(`/api/projects/${projectId}/archive`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(resArchive.status).toBe(200);
      expect(resArchive.body.data.status).toBe('archived');

      const resUnarchive = await request(app)
        .patch(`/api/projects/${projectId}/archive`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(resUnarchive.status).toBe(200);
      expect(resUnarchive.body.data.status).toBe('active');
    });
  });

  describe('GET /api/projects/:id/stats', () => {
    it('debe retornar estadísticas rápidas del proyecto con código 200', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}/stats`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.funnel_count).toBeDefined();
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('debe rechazar la eliminación si el usuario no es admin (código 403)', async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INSUFFICIENT_ROLE');
    });

    it('debe permitir eliminar el proyecto al usuario admin con código 200', async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
