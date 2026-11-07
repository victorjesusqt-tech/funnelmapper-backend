const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'funnelmapper_jwt_secret_key_2026_cambiar_en_produccion';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'funnelmapper_refresh_secret_2026';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

class TokenService {
  /**
   * Generar Access Token JWT
   */
  static generateAccessToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });
  }

  /**
   * Generar Refresh Token JWT
   */
  static generateRefreshToken(user) {
    const payload = {
      id: user.id,
      jti: crypto.randomBytes(16).toString('hex')
    };

    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN
    });
  }

  /**
   * Verificar Access Token JWT
   */
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        const error = new Error('El access token ha expirado');
        error.code = 'TOKEN_EXPIRED';
        error.statusCode = 401;
        throw error;
      }
      const error = new Error('Token malformado o firma inválida');
      error.code = 'TOKEN_INVALID';
      error.statusCode = 401;
      throw error;
    }
  }

  /**
   * Verificar Refresh Token JWT
   */
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        const error = new Error('El refresh token ha expirado');
        error.code = 'TOKEN_EXPIRED';
        error.statusCode = 401;
        throw error;
      }
      const error = new Error('Refresh token inválido');
      error.code = 'TOKEN_INVALID';
      error.statusCode = 401;
      throw error;
    }
  }

  /**
   * Hashear un token para guardarlo o buscarlo en BD (SHA256)
   */
  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Calcular fecha de expiración del refresh token (por defecto 30 días)
   */
  static getRefreshTokenExpiryDate() {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  }
}

module.exports = TokenService;
