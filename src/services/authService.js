const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const TokenModel = require('../models/tokenModel');
const ActivityLogModel = require('../models/activityLogModel');
const TokenService = require('./tokenService');
require('dotenv').config();

const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

class AuthService {
  /**
   * Hashear contraseña con bcrypt
   */
  static async hashPassword(password) {
    return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  /**
   * Comparar contraseña en texto plano con hash
   */
  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Registro de un nuevo usuario
   */
  static async register({ name, email, password, ipAddress = null, userAgent = null }) {
    // 1. Verificar si el email ya existe
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      const error = new Error('El correo electrónico ya se encuentra registrado');
      error.code = 'EMAIL_ALREADY_EXISTS';
      error.statusCode = 409;
      throw error;
    }

    // 2. Hashear contraseña
    const passwordHash = await this.hashPassword(password);

    // 3. Crear usuario (rol 'editor' por defecto)
    const newUser = await UserModel.create({
      name,
      email,
      passwordHash,
      role: 'editor'
    });

    // 4. Generar tokens
    const accessToken = TokenService.generateAccessToken(newUser);
    const refreshToken = TokenService.generateRefreshToken(newUser);

    // 5. Guardar hash de refresh token en BD
    const tokenHash = TokenService.hashToken(refreshToken);
    const expiresAt = TokenService.getRefreshTokenExpiryDate();
    await TokenModel.create({
      userId: newUser.id,
      tokenHash,
      expiresAt,
      ipAddress,
      userAgent
    });

    // 6. Registrar en activity_logs
    await ActivityLogModel.log({
      userId: newUser.id,
      action: 'USER_REGISTERED',
      entityType: 'user',
      entityId: newUser.id,
      details: { email: newUser.email, role: newUser.role },
      ipAddress,
      userAgent
    });

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar_url: newUser.avatar_url,
        is_active: newUser.is_active
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Inicio de sesión
   */
  static async login({ email, password, ipAddress = null, userAgent = null }) {
    // 1. Buscar usuario por email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      const error = new Error('Email o contraseña incorrectos');
      error.code = 'INVALID_CREDENTIALS';
      error.statusCode = 401;
      throw error;
    }

    // 2. Verificar que el usuario esté activo
    if (!user.is_active) {
      const error = new Error('La cuenta de usuario está desactivada');
      error.code = 'USER_INACTIVE';
      error.statusCode = 403;
      throw error;
    }

    // 3. Comparar contraseñas
    const isValidPassword = await this.comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      const error = new Error('Email o contraseña incorrectos');
      error.code = 'INVALID_CREDENTIALS';
      error.statusCode = 401;
      throw error;
    }

    // 4. Actualizar fecha de último login
    await UserModel.updateLastLogin(user.id);

    // 5. Revocar refresh tokens anteriores y crear uno nuevo
    await TokenModel.revokeAllUserTokens(user.id);

    const accessToken = TokenService.generateAccessToken(user);
    const refreshToken = TokenService.generateRefreshToken(user);

    const tokenHash = TokenService.hashToken(refreshToken);
    const expiresAt = TokenService.getRefreshTokenExpiryDate();
    await TokenModel.create({
      userId: user.id,
      tokenHash,
      expiresAt,
      ipAddress,
      userAgent
    });

    // 6. Registrar en activity_logs
    await ActivityLogModel.log({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'user',
      entityId: user.id,
      ipAddress,
      userAgent
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        last_login: user.last_login
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Cerrar sesión (invalidar refresh token)
   */
  static async logout({ refreshToken, userId = null, ipAddress = null, userAgent = null }) {
    if (refreshToken) {
      const tokenHash = TokenService.hashToken(refreshToken);
      await TokenModel.revokeToken(tokenHash);
    } else if (userId) {
      await TokenModel.revokeAllUserTokens(userId);
    }

    if (userId) {
      await ActivityLogModel.log({
        userId,
        action: 'USER_LOGOUT',
        entityType: 'user',
        entityId: userId,
        ipAddress,
        userAgent
      });
    }

    return true;
  }

  /**
   * Renovar access token mediante refresh token
   */
  static async refresh({ refreshToken, ipAddress = null, userAgent = null }) {
    // 1. Verificar firma del refresh token
    const decoded = TokenService.verifyRefreshToken(refreshToken);

    // 2. Comprobar si existe y sigue activo en la base de datos
    const tokenHash = TokenService.hashToken(refreshToken);
    const storedToken = await TokenModel.findValidToken(tokenHash);
    if (!storedToken) {
      const error = new Error('Refresh token inválido, expirado o revocado');
      error.code = 'TOKEN_INVALID';
      error.statusCode = 401;
      throw error;
    }

    // 3. Buscar datos del usuario
    const user = await UserModel.findById(decoded.id);
    if (!user || !user.is_active) {
      const error = new Error('Usuario no encontrado o inactivo');
      error.code = 'USER_INACTIVE';
      error.statusCode = 403;
      throw error;
    }

    // 4. Generar nuevo access token
    const newAccessToken = TokenService.generateAccessToken(user);

    return {
      accessToken: newAccessToken
    };
  }

  /**
   * Obtener perfil del usuario
   */
  static async getProfile(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.code = 'USER_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    return user;
  }

  /**
   * Actualizar perfil
   */
  static async updateProfile(userId, { name, avatar_url }) {
    const updatedUser = await UserModel.updateProfile(userId, { name, avatar_url });
    return updatedUser;
  }

  /**
   * Cambiar contraseña
   */
  static async changePassword(userId, { currentPassword, newPassword, ipAddress = null, userAgent = null }) {
    const user = await UserModel.findByIdWithPassword(userId);
    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.code = 'USER_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    // Validar contraseña actual
    const isValid = await this.comparePassword(currentPassword, user.password_hash);
    if (!isValid) {
      const error = new Error('La contraseña actual es incorrecta');
      error.code = 'INVALID_CREDENTIALS';
      error.statusCode = 401;
      throw error;
    }

    // Hashear nueva contraseña
    const newPasswordHash = await this.hashPassword(newPassword);
    await UserModel.updatePassword(userId, newPasswordHash);

    // Revocar todas las sesiones anteriores
    await TokenModel.revokeAllUserTokens(userId);

    // Registrar en activity_logs
    await ActivityLogModel.log({
      userId,
      action: 'USER_PASSWORD_CHANGED',
      entityType: 'user',
      entityId: userId,
      ipAddress,
      userAgent
    });

    return true;
  }
}

module.exports = AuthService;
