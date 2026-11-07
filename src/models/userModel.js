const pool = require('../config/database');

class UserModel {
  /**
   * Buscar usuario por correo electrónico
   */
  static async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT id, name, email, password_hash, role, avatar_url, is_active, last_login, created_at, updated_at FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    return rows[0] || null;
  }

  /**
   * Buscar usuario por ID
   */
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, avatar_url, is_active, last_login, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Buscar usuario con password_hash por ID (para cambio de clave)
   */
  static async findByIdWithPassword(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, password_hash, role, avatar_url, is_active FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Crear un nuevo usuario
   */
  static async create({ name, email, passwordHash, role = 'editor', avatarUrl = null }) {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, avatar_url, is_active) VALUES (?, ?, ?, ?, ?, 1)',
      [name, email, passwordHash, role, avatarUrl]
    );

    return {
      id: result.insertId,
      name,
      email,
      role,
      avatar_url: avatarUrl,
      is_active: 1
    };
  }

  /**
   * Actualizar fecha de último login
   */
  static async updateLastLogin(id) {
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [id]
    );
  }

  /**
   * Actualizar perfil (nombre y avatar)
   */
  static async updateProfile(id, { name, avatar_url }) {
    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name);
    }
    if (avatar_url !== undefined) {
      fields.push('avatar_url = ?');
      values.push(avatar_url);
    }

    if (fields.length === 0) return await this.findById(id);

    values.push(id);
    await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findById(id);
  }

  /**
   * Actualizar contraseña
   */
  static async updatePassword(id, passwordHash) {
    await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, id]
    );
  }
}

module.exports = UserModel;
