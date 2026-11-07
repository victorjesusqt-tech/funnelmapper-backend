const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const logger = require('../utils/logger');
const { globalLimiter } = require('../middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('../middleware/errorHandler');

const app = express();

// 1. Headers de seguridad con Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// 2. Configuración de CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// 3. Rate limiting global
app.use(globalLimiter);

// 4. Parsing de cuerpo de peticiones
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Logging HTTP con Morgan vinculado a Winston
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  })
);

// 6. Endpoint de verificación de estado (Healthcheck)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    },
    message: 'Servicio FunnelMapper API operativo',
    timestamp: new Date().toISOString()
  });
});

// Rutas de la API
const authRoutes = require('../routes/authRoutes');
const projectRoutes = require('../routes/projectRoutes');
const nodeTypeRoutes = require('../routes/nodeTypeRoutes');
const templateRoutes = require('../routes/templateRoutes');
const funnelRoutes = require('../routes/funnelRoutes');
const metricsRoutes = require('../routes/metricsRoutes');
const exportRoutes = require('../routes/exportRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/node-types', nodeTypeRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/funnels', funnelRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/export', exportRoutes);

// Servir cliente web frontend y lienzo interactivo
const frontendPath = path.resolve(__dirname, '../../../frontend');
app.use(express.static(frontendPath));
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 7. Manejo de rutas no encontradas (404)
app.use(notFoundHandler);

// 8. Manejador de errores global
app.use(errorHandler);

module.exports = app;
