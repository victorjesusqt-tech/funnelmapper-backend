const logger = require('../utils/logger');

// Middleware para rutas no encontradas (404)
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
      details: []
    },
    timestamp: new Date().toISOString()
  });
};

// Middleware global de manejo de errores
const errorHandler = (err, req, res, next) => {
  logger.error('Error capturado por errorHandler: %o', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  const statusCode = err.statusCode || (err.status ? err.status : 500);
  const errorCode = err.code || 'INTERNAL_ERROR';
  const errorMessage = err.message || 'Error interno del servidor';
  const details = err.details || [];

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
      details: details
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};
