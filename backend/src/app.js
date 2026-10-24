const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const config = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const swaggerSpec = require('./config/swagger');
const ApiError = require('./utils/apiError');

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS Configuration
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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

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
