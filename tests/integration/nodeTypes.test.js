const request = require('supertest');
const app = require('../../src/config/app');
const pool = require('../../src/config/database');

describe('Node Types API Integration Tests', () => {
  let userToken = '';

  beforeAll(async () => {
    // Login como admin para obtener token autenticado
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@funnelmapper.local',
        password: 'Admin123!'
      });
    userToken = adminRes.body.data.accessToken;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/node-types', () => {
    it('debe rechazar la petición sin token de autenticación (código 401)', async () => {
      const res = await request(app).get('/api/node-types');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('debe listar todos los tipos de nodo activos con código 200 (mínimo 30 tipos)', async () => {
      const res = await request(app)
        .get('/api/node-types')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(30);

      const firstItem = res.body.data[0];
      expect(firstItem.id).toBeDefined();
      expect(firstItem.name).toBeDefined();
      expect(firstItem.slug).toBeDefined();
      expect(firstItem.category).toBeDefined();
    });

    it('debe filtrar tipos de nodo por categoría (?category=traffic)', async () => {
      const res = await request(app)
        .get('/api/node-types?category=traffic')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach(node => {
        expect(node.category).toBe('traffic');
      });
    });
  });

  describe('GET /api/node-types/categories', () => {
    it('debe retornar la lista de categorías disponibles con sus conteos', async () => {
      const res = await request(app)
        .get('/api/node-types/categories')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const categories = res.body.data.map(c => c.category);
      expect(categories).toContain('traffic');
      expect(categories).toContain('page');
      expect(categories).toContain('action');
    });
  });

  describe('GET /api/node-types/slug/:slug', () => {
    it('debe retornar el tipo de nodo por su slug (google-ads)', async () => {
      const res = await request(app)
        .get('/api/node-types/slug/google-ads')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('google-ads');
      expect(res.body.data.name).toBe('Google Ads');
      expect(res.body.data.category).toBe('traffic');
    });

    it('debe retornar 404 si el slug no existe', async () => {
      const res = await request(app)
        .get('/api/node-types/slug/slug-inexistente-xyz')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NODE_TYPE_NOT_FOUND');
    });
  });

  describe('GET /api/node-types/:id', () => {
    it('debe retornar el tipo de nodo por su ID numérico', async () => {
      // 1. Obtener primer nodo
      const listRes = await request(app)
        .get('/api/node-types')
        .set('Authorization', `Bearer ${userToken}`);
      const testId = listRes.body.data[0].id;

      // 2. Consultar por ID
      const res = await request(app)
        .get(`/api/node-types/${testId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testId);
    });

    it('debe retornar 404 si el ID no existe', async () => {
      const res = await request(app)
        .get('/api/node-types/999999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NODE_TYPE_NOT_FOUND');
    });

    it('debe retornar 400 si el ID no es numérico', async () => {
      const res = await request(app)
        .get('/api/node-types/abc')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_ID');
    });
  });
});
