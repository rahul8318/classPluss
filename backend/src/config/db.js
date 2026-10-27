const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 5000 });
    logger.info(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB primary connection failed: ${error.message}`);
    
    // Fallback to local MongoDB if Atlas connection is blocked by IP whitelist
    if (config.mongodbUri.includes('mongodb+srv://')) {
      logger.warn('⚠️ Atlas connection timed out (IP whitelist required). Attempting local fallback: mongodb://localhost:27017/classpulse_learning_workspace');
      try {
        const localConn = await mongoose.connect('mongodb://localhost:27017/classpulse_learning_workspace', {
          serverSelectionTimeoutMS: 3000,
        });
        logger.info(`MongoDB Connected to local fallback: ${localConn.connection.host}/${localConn.connection.name}`);
        return localConn;
      } catch (fallbackError) {
        logger.error(`Local MongoDB fallback also failed: ${fallbackError.message}`);
      }
    }

    if (config.nodeEnv !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed.');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
  }
};

module.exports = { connectDB, disconnectDB };
