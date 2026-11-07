const { validationResult } = require('express-validator');

/**
 * Middleware que evalúa el resultado de express-validator.
 * Si existen errores de validación, retorna respuesta 422 estandarizada.
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos de entrada inválidos',
        details: errors.array().map(err => ({
          field: err.path || err.param,
          message: err.msg,
          value: err.value
        }))
      },
      timestamp: new Date().toISOString()
    });
  }
  next();
};

module.exports = validateRequest;
