const TokenService = require('../services/tokenService');
const UserModel = require('../models/userModel');

/**
 * Middleware para verificar JWT en cabecera Authorization
 */
const verificarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_INVALID',
          message: 'Encabezado de autorización ausente o formato incorrecto (se requiere Bearer token)',
          details: []
        },
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_INVALID',
          message: 'Token de acceso no proporcionado',
          details: []
        },
        timestamp: new Date().toISOString()
      });
    }

    // Verificar firma y expiración
    const decoded = TokenService.verifyAccessToken(token);

    // Verificar que el usuario existe y está activo
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_INVALID',
          message: 'Usuario asociado al token ya no existe',
          details: []
        },
        timestamp: new Date().toISOString()
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: 'Cuenta de usuario desactivada',
          details: []
        },
        timestamp: new Date().toISOString()
      });
    }

    // Adjuntar usuario al objeto req
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    const statusCode = error.statusCode || 401;
    const errorCode = error.code || 'TOKEN_INVALID';
    return res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        details: []
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware para autorizar según roles
 * @param  {...string} rolesPermitidos - Roles permitidos ('admin', 'editor', 'viewer')
 */
const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: 'El usuario no tiene el rol requerido para realizar esta acción',
          details: []
        },
        timestamp: new Date().toISOString()
      });
    }
    next();
  };
};

module.exports = {
  verificarToken,
  verificarRol
};
