const express = require('express');
const AuthController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const { verificarToken } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  updateProfileValidator,
  changePasswordValidator
} = require('../utils/validators');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registrar un nuevo usuario
 * @access  Público
 */
router.post(
  '/register',
  authLimiter,
  registerValidator,
  validateRequest,
  AuthController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión y obtener tokens JWT
 * @access  Público
 */
router.post(
  '/login',
  authLimiter,
  loginValidator,
  validateRequest,
  AuthController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Renovar el access token usando refresh token
 * @access  Público
 */
router.post(
  '/refresh',
  refreshTokenValidator,
  validateRequest,
  AuthController.refresh
);

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión e invalidar refresh token
 * @access  Privado (o con token de refresco)
 */
router.post(
  '/logout',
  verificarToken,
  AuthController.logout
);

/**
 * @route   GET /api/auth/me
 * @desc    Obtener datos del usuario autenticado
 * @access  Privado
 */
router.get(
  '/me',
  verificarToken,
  AuthController.me
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Actualizar nombre y/o avatar del perfil
 * @access  Privado
 */
router.put(
  '/profile',
  verificarToken,
  updateProfileValidator,
  validateRequest,
  AuthController.updateProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Cambiar contraseña del usuario
 * @access  Privado
 */
router.put(
  '/change-password',
  verificarToken,
  changePasswordValidator,
  validateRequest,
  AuthController.changePassword
);

module.exports = router;
