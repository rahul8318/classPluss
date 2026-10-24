const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || '/api',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',').map(s => s.trim()),
  mongodbUri: process.env.NODE_ENV === 'test'
    ? (process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/classpulse_test')
    : (process.env.MONGODB_URI || 'mongodb://localhost:27017/classpulse_learning_workspace'),
  jwt: {
    secret: process.env.JWT_SECRET || 'classpulse_super_secret_jwt_key_2026_education_platform',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'classpulse-auth-service',
    audience: process.env.JWT_AUDIENCE || 'classpulse-clients',
  },
  upload: {
    dir: path.resolve(__dirname, '../../', process.env.UPLOAD_DIR || 'uploads'),
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 25,
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'custom',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
  },
  springBoot: {
    apiUrl: process.env.SPRING_BOOT_API_URL || 'http://localhost:8080',
  },
};

module.exports = config;
