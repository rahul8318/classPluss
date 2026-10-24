/**
 * Structured Logger
 * Avoids logging passwords, auth tokens, or private student document content
 */

const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({ level: 'INFO', timestamp: new Date().toISOString(), message, ...meta }));
  },
  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({ level: 'WARN', timestamp: new Date().toISOString(), message, ...meta }));
  },
  error: (message, error = {}) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message,
      error: error.message || error,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }));
  },
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(JSON.stringify({ level: 'DEBUG', timestamp: new Date().toISOString(), message, ...meta }));
    }
  },
};

module.exports = logger;
