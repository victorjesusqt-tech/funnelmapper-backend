const AuthService = require('../../src/services/authService');
const TokenService = require('../../src/services/tokenService');
const jwt = require('jsonwebtoken');

describe('AuthService & TokenService Unit Tests', () => {
  const plainPassword = 'Password123!';

  describe('Password Hashing and Comparison', () => {
    it('debe generar un hash de contraseña válido con bcrypt', async () => {
      const hash = await AuthService.hashPassword(plainPassword);
      expect(hash).toBeDefined();
      expect(hash.startsWith('$2')).toBe(true);
      expect(hash).not.toBe(plainPassword);
    });

    it('debe retornar true si la contraseña coincide con el hash', async () => {
      const hash = await AuthService.hashPassword(plainPassword);
      const isMatch = await AuthService.comparePassword(plainPassword, hash);
      expect(isMatch).toBe(true);
    });

    it('debe retornar false si la contraseña es incorrecta', async () => {
      const hash = await AuthService.hashPassword(plainPassword);
      const isMatch = await AuthService.comparePassword('WrongPassword123!', hash);
      expect(isMatch).toBe(false);
    });
  });

  describe('JWT Token Generation and Verification', () => {
    const userPayload = {
      id: 99,
      email: 'unit_test@example.com',
      role: 'editor'
    };

    it('debe generar un access token con los claims correctos', () => {
      const token = TokenService.generateAccessToken(userPayload);
      expect(typeof token).toBe('string');

      const decoded = TokenService.verifyAccessToken(token);
      expect(decoded.id).toBe(userPayload.id);
      expect(decoded.email).toBe(userPayload.email);
      expect(decoded.role).toBe(userPayload.role);
      expect(decoded.exp).toBeDefined();
    });

    it('debe generar un refresh token con jti y id', () => {
      const refreshToken = TokenService.generateRefreshToken(userPayload);
      expect(typeof refreshToken).toBe('string');

      const decoded = TokenService.verifyRefreshToken(refreshToken);
      expect(decoded.id).toBe(userPayload.id);
      expect(decoded.jti).toBeDefined();
    });

    it('debe rechazar tokens con firma inválida', () => {
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';
      expect(() => {
        TokenService.verifyAccessToken(invalidToken);
      }).toThrow();
    });

    it('debe rechazar tokens expirados', () => {
      const expiredToken = jwt.sign(
        { id: userPayload.id },
        process.env.JWT_SECRET || 'funnelmapper_jwt_secret_key_2026_cambiar_en_produccion',
        { expiresIn: '-1s' }
      );

      expect(() => {
        TokenService.verifyAccessToken(expiredToken);
      }).toThrow('El access token ha expirado');
    });
  });
});
