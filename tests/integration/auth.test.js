const request = require('supertest');
const app = require('../../src/config/app');
const pool = require('../../src/config/database');

describe('Auth API Integration Tests', () => {
  const uniqueId = Date.now();
  const testUser = {
    name: 'Ana Gomez',
    email: `ana_${uniqueId}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  let accessToken = '';

  afterAll(async () => {
    // Cerrar el pool de MySQL al terminar las pruebas de Jest
    await pool.end();
  });

  describe('POST /api/auth/register', () => {
    it('debe registrar un usuario exitosamente con código 201', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      accessToken = res.body.data.accessToken;
    });

    it('debe rechazar el registro si el email ya existe con código 409', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('debe validar campos requeridos y retornar código 422', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: '',
          email: 'no-es-un-correo',
          password: '123',
          confirmPassword: '456'
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.error.details)).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    it('debe iniciar sesión con credenciales válidas y retornar tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('debe rechazar inicio de sesión con contraseña incorrecta con código 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'IncorrectPassword123!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/me', () => {
    it('debe retornar perfil del usuario con token válido', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
    });

    it('debe rechazar petición sin token con código 401', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TOKEN_INVALID');
    });
  });
});
