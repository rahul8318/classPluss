const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const logger = require('./utils/logger');

let server;

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(config.port, () => {
      logger.info(`ClassPulse MERN Backend running in ${config.nodeEnv} mode on port ${config.port}`);
      logger.info(`API Base URL: http://localhost:${config.port}${config.apiPrefix}`);
      logger.info(`Swagger Documentation: http://localhost:${config.port}/api/docs`);
    });
  } catch (error) {
    logger.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = async signal => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
