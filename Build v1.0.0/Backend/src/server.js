#!/usr/bin/env node

/**
 * Atlas AI Backend Server
 * Main server file for the Atlas AI Support Assistant API
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
require('dotenv').config();

// Import custom modules (to be implemented)
// const connectDB = require('./config/database');
// const authRoutes = require('./routes/auth');
// const userRoutes = require('./routes/users');
// const kbRoutes = require('./routes/knowledge');
// const chatRoutes = require('./routes/chat');
// const configRoutes = require('./routes/config');
// const errorHandler = require('./middleware/errorHandler');
// const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Speed limiting for expensive operations
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500 // begin adding 500ms of delay per request above 50
});

app.use(limiter);
app.use('/api/chat', speedLimiter); // Apply speed limiting to chat endpoints

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Security enhancements
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Compression
app.use(compression());

// Logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Connect to database
// connectDB();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: require('../package.json').version,
    database: 'connected', // This would be dynamic based on actual DB connection
    services: {
      api: 'healthy',
      database: 'healthy',
      ai: 'healthy'
    }
  });
});

// API routes
app.use('/api/auth', (req, res) => {
  res.status(501).json({
    message: 'Authentication routes not yet implemented',
    endpoints: [
      'POST /api/auth/login',
      'POST /api/auth/logout',
      'GET /api/auth/me'
    ]
  });
});

app.use('/api/users', (req, res) => {
  res.status(501).json({
    message: 'User management routes not yet implemented',
    endpoints: [
      'GET /api/users',
      'POST /api/users',
      'PUT /api/users/:id',
      'DELETE /api/users/:id'
    ]
  });
});

app.use('/api/kb', (req, res) => {
  res.status(501).json({
    message: 'Knowledge base routes not yet implemented',
    endpoints: [
      'GET /api/kb',
      'POST /api/kb',
      'PUT /api/kb/:id',
      'DELETE /api/kb/:id'
    ]
  });
});

app.use('/api/chat', (req, res) => {
  res.status(501).json({
    message: 'Chat routes not yet implemented',
    endpoints: [
      'POST /api/chat',
      'GET /api/chat/history',
      'POST /api/chat/feedback'
    ]
  });
});

app.use('/api/config', (req, res) => {
  res.status(501).json({
    message: 'Configuration routes not yet implemented',
    endpoints: [
      'GET /api/config/permissions',
      'PUT /api/config/permissions',
      'GET /api/config/model',
      'PUT /api/config/model'
    ]
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Atlas AI Backend API',
    version: require('../package.json').version,
    description: 'Backend API for Atlas AI Support Assistant',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      knowledgeBase: '/api/kb',
      chat: '/api/chat',
      config: '/api/config',
      health: '/api/health'
    },
    documentation: 'https://github.com/YOUR_USERNAME/atlas-ai/blob/main/Backend/README.md'
  });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Atlas AI Backend Server',
    version: require('../package.json').version,
    status: 'running',
    api: '/api',
    health: '/api/health',
    documentation: 'https://github.com/YOUR_USERNAME/atlas-ai'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  const isDevelopment = NODE_ENV === 'development';

  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
      ...(isDevelopment && { stack: err.stack })
    }
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err.message);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                    Atlas AI Backend                     ║
║                                                          ║
║  🚀 Server running on port ${PORT}                        ║
║  🌍 Environment: ${NODE_ENV.padEnd(10)}                      ║
║  📊 Health Check: http://localhost:${PORT}/api/health     ║
║  📚 API Docs: http://localhost:${PORT}/api               ║
║                                                          ║
║  Ready to accept connections!                            ║
╚══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;