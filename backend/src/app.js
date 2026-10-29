const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const rateLimit = require('express-rate-limit');

const config = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const swaggerSpec = require('./config/swagger');
const ApiError = require('./utils/apiError');

const app = express();

// Trust reverse proxy for accurate IP address determination
app.set('trust proxy', 1);

// Security Headers (Wooclap-standard defense against XSS, clickjacking, MIME sniffing)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS Configuration with Device Header support
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (config.allowedOrigins.includes(origin) || config.nodeEnv === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Device-Id'],
  })
);

// Wooclap-style API Rate Limiting (Brute-force protection for check-ins and authentication)
if (config.nodeEnv !== 'test') {
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 600, // Limit each IP to 600 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  });
  app.use('/api', generalLimiter);

  const authCheckInLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit check-ins and logins to 30 attempts per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many authentication or check-in attempts. Please wait a minute.' },
  });
  app.use('/api/attendance/check-in', authCheckInLimiter);
  app.use('/api/auth/login', authCheckInLimiter);
}

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Static files for uploads (accessible with appropriate path)
app.use('/uploads', express.static(config.upload.dir));

// Interactive Swagger API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'ClassPulse MERN API Documentation',
}));

// API Root Routes
app.use(config.apiPrefix, routes);

// Root Welcome Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ClassPulse Learning Workspace MERN API',
    documentation: `/api/docs`,
    health: `${config.apiPrefix}/health`,
  });
});

// 404 Catch-all Handler
app.use((req, res, next) => {
  next(ApiError.notFound(`Endpoint ${req.originalUrl} not found on this server`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
