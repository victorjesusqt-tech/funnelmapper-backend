const app = require('./src/config/app');
const pool = require('./src/config/database');
const logger = require('./src/utils/logger');
require('dotenv').config();

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  try {
    // 1. Probar conexión a la base de datos MariaDB / MySQL
    const connection = await pool.getConnection();
    logger.info('✓ Conexión a la base de datos MariaDB establecida con éxito (funnelmapper_db)');
    connection.release();

    // 2. Iniciar servidor HTTP
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Servidor FunnelMapper corriendo en http://localhost:${PORT}`);
      logger.info(`Entorno: ${process.env.NODE_ENV || 'development'}`);
    });

    // 3. Manejo de cierre elegante (Graceful Shutdown)
    const shutdown = async (signal) => {
      logger.info(`Señal ${signal} recibida. Cerrando servidor de manera ordenada...`);
      server.close(async () => {
        logger.info('Servidor HTTP cerrado.');
        try {
          await pool.end();
          logger.info('Pool de conexiones MySQL cerrado.');
          process.exit(0);
        } catch (err) {
          logger.error('Error cerrando el pool MySQL:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection: %o', reason);
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception: %o', err);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
