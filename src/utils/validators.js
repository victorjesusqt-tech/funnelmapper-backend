const { body, param, query } = require('express-validator');

// Regex para nombres con solo letras y espacios (incluye tildes y diéresis)
const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

// Regex para contraseña: mín 8 chars, 1 mayúscula, 1 número, 1 carácter especial
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

// Validación para registro de usuario
const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(NAME_REGEX).withMessage('El nombre solo debe contener letras y espacios'),

  body('email')
    .trim()
    .notEmpty().withMessage('El correo electrónico es requerido')
    .isEmail().withMessage('El formato del correo electrónico no es válido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(PASSWORD_REGEX).withMessage('La contraseña debe contener al menos 1 letra mayúscula, 1 número y 1 carácter especial'),

  body('confirmPassword')
    .notEmpty().withMessage('La confirmación de contraseña es requerida')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    })
];

// Validación para login
const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('El correo electrónico es requerido')
    .isEmail().withMessage('El formato del correo electrónico no es válido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
];

// Validación para refresh token
const refreshTokenValidator = [
  body('refreshToken')
    .notEmpty().withMessage('El refresh token es requerido')
    .isString().withMessage('El refresh token debe ser una cadena de texto')
];

// Validación para actualizar perfil
const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(NAME_REGEX).withMessage('El nombre solo debe contener letras y espacios'),

  body('avatar_url')
    .optional({ nullable: true, checkFalsy: true })
    .isURL().withMessage('El avatar debe ser una URL válida')
];

// Validación para cambio de contraseña
const changePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('La contraseña actual es requerida'),

  body('newPassword')
    .notEmpty().withMessage('La nueva contraseña es requerida')
    .isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres')
    .matches(PASSWORD_REGEX).withMessage('La nueva contraseña debe contener al menos 1 letra mayúscula, 1 número y 1 carácter especial')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('La nueva contraseña debe ser diferente a la contraseña actual');
      }
      return true;
    }),

  body('confirmNewPassword')
    .notEmpty().withMessage('La confirmación de la nueva contraseña es requerida')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Las nuevas contraseñas no coinciden');
      }
      return true;
    })
];

// Regex para código de color hexadecimal
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

// Validación para creación de proyecto
const createProjectValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre del proyecto es requerido')
    .isLength({ min: 3, max: 200 }).withMessage('El nombre debe tener entre 3 y 200 caracteres'),

  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres'),

  body('color')
    .optional()
    .matches(HEX_COLOR_REGEX).withMessage('El color debe tener un formato hexadecimal válido (ej: #4A90E2)'),

  body('is_public')
    .optional()
    .isBoolean().withMessage('El campo is_public debe ser booleano')
];

// Validación para actualización de proyecto
const updateProjectValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del proyecto debe ser un número entero válido'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('El nombre debe tener entre 3 y 200 caracteres'),

  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres'),

  body('color')
    .optional()
    .matches(HEX_COLOR_REGEX).withMessage('El color debe tener un formato hexadecimal válido (ej: #4A90E2)'),

  body('is_public')
    .optional()
    .isBoolean().withMessage('El campo is_public debe ser booleano'),

  body('status')
    .optional()
    .isIn(['draft', 'active', 'archived']).withMessage('El estado debe ser draft, active o archived')
];

// Validación de parámetro ID de proyecto
const projectIdValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del proyecto debe ser un número entero válido')
];

// Validación para listado y paginación de proyectos
const projectQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('La página debe ser un número entero mayor a 0'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100'),

  query('status')
    .optional()
    .isIn(['draft', 'active', 'archived']).withMessage('El estado debe ser draft, active o archived'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('El término de búsqueda no puede superar 100 caracteres')
];

module.exports = {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  updateProfileValidator,
  changePasswordValidator,
  createProjectValidator,
  updateProjectValidator,
  projectIdValidator,
  projectQueryValidator
};

