const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ClassPulse MERN Learning Workspace API',
      version: '1.0.0',
      description: `
REST API Documentation for the ClassPulse Learning Workspace MERN Backend.
Handles Course Management, Enrollments, Assignments, Submissions, Question Banks, 
Assessments, Auto-Grading, Attendance Records, Document Processing, and RAG AI Study Assistant.

Designed to operate independently alongside the ClassPulse Spring Boot Live Classroom backend.
      `,
      contact: {
        name: 'ClassPulse Development Team',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}${config.apiPrefix}`,
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Provide JWT token obtained from /auth/login or /auth/register',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
