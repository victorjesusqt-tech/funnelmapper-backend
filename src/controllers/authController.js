const AuthService = require('../services/authService');

class AuthController {
  /**
   * POST /api/auth/register
   */
  static async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await AuthService.register({
        name,
        email,
        password,
        ipAddress,
        userAgent
      });

      return res.status(201).json({
        success: true,
        data: result,
        message: 'Usuario registrado exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await AuthService.login({
        email,
        password,
        ipAddress,
        userAgent
      });

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Inicio de sesión exitoso',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   */
  static async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const userId = req.user ? req.user.id : null;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      await AuthService.logout({
        refreshToken,
        userId,
        ipAddress,
        userAgent
      });

      return res.status(200).json({
        success: true,
        data: null,
        message: 'Sesión cerrada exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   */
  static async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await AuthService.refresh({
        refreshToken,
        ipAddress,
        userAgent
      });

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Token de acceso renovado exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   */
  static async me(req, res, next) {
    try {
      const user = await AuthService.getProfile(req.user.id);

      return res.status(200).json({
        success: true,
        data: user,
        message: 'Perfil de usuario obtenido exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/auth/profile
   */
  static async updateProfile(req, res, next) {
    try {
      const { name, avatar_url } = req.body;
      const updatedUser = await AuthService.updateProfile(req.user.id, { name, avatar_url });

      return res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'Perfil actualizado exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/auth/change-password
   */
  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      await AuthService.changePassword(req.user.id, {
        currentPassword,
        newPassword,
        ipAddress,
        userAgent
      });

      return res.status(200).json({
        success: true,
        data: null,
        message: 'Contraseña actualizada exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
