/**
 * IU Unified Backend - Main Server
 * Provides REST API for Hyperledger Fabric blockchain network
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const loanRoutes = require('./routes/loans');
const governanceRoutes = require('./routes/governance');
const healthRoutes = require('./routes/health');
const errorHandler = require('./middleware/errorHandler');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || 'localhost';

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.use('/health', healthRoutes);

// API routes
app.use('/api/loans', loanRoutes);
app.use('/api/governance', governanceRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'IU Unified Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      loans: '/api/loans',
      governance: '/api/governance'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(PORT, HOST, () => {
  logger.info(`🚀 IU Unified Backend Server started`);
  logger.info(`📍 Server running at http://${HOST}:${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📊 Blockchain Network: Connected`);
  logger.info(`   - Governance Channel: ${process.env.CHANNEL_GOVERNANCE}`);
  logger.info(`   - Financial Channel: ${process.env.CHANNEL_FINANCIAL}`);
  logger.info(`   - Chaincode: ${process.env.CHAINCODE_NAME}`);
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, closing server...');
  server.close(() => {
    logger.info('Server closed successfully');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;
