const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Limitador global para la API
const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: Number(process.env.RATE_LIMIT_MAX) || 100, // Max 100 peticiones por ventana
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Demasiadas peticiones desde esta IP, por favor intenta nuevamente más tarde.',
        details: []
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Limitador estricto para endpoints de autenticación (/login, /register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Max 10 intentos
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Demasiados intentos de autenticación. Por seguridad, espera 15 minutos.',
        details: []
      },
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = {
  globalLimiter,
  authLimiter
};
