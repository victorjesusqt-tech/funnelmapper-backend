const pool = require('../config/database');

class TokenModel {
  /**
   * Guardar nuevo refresh token
   */
  static async create({ userId, tokenHash, expiresAt, ipAddress = null, userAgent = null }) {
    const [result] = await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
      [userId, tokenHash, expiresAt, ipAddress, userAgent]
    );
    return result.insertId;
  }

  /**
   * Buscar refresh token válido (no revocado y no expirado)
   */
  static async findValidToken(tokenHash) {
    const [rows] = await pool.query(
      'SELECT id, user_id, token_hash, expires_at, is_revoked FROM refresh_tokens WHERE token_hash = ? AND is_revoked = 0 AND expires_at > NOW() LIMIT 1',
      [tokenHash]
    );
    return rows[0] || null;
  }

  /**
   * Revocar un refresh token específico
   */
  static async revokeToken(tokenHash) {
    await pool.query(
      'UPDATE refresh_tokens SET is_revoked = 1 WHERE token_hash = ?',
      [tokenHash]
    );
  }

  /**
   * Revocar todos los refresh tokens de un usuario
   */
  static async revokeAllUserTokens(userId) {
    await pool.query(
      'UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = ?',
      [userId]
    );
  }
}

module.exports = TokenModel;
