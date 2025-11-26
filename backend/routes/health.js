/**
 * Health Check Routes
 * Monitor backend and blockchain network status
 */

const express = require('express');
const router = express.Router();
const fabricGateway = require('../fabric/gateway');
const logger = require('../utils/logger');

/**
 * GET /health
 * Basic health check
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'IU Unified Backend'
  });
});

/**
 * GET /health/blockchain
 * Check blockchain connectivity
 */
router.get('/blockchain', async (req, res) => {
  try {
    const organizations = ['government', 'creditor', 'debtor'];
    const status = {};

    for (const org of organizations) {
      try {
        await fabricGateway.getGateway(org);
        status[org] = 'connected';
      } catch (error) {
        status[org] = 'disconnected';
        logger.error(`Health check failed for ${org}:`, error.message);
      }
    }

    const allConnected = Object.values(status).every(s => s === 'connected');

    res.json({
      status: allConnected ? 'healthy' : 'degraded',
      blockchain: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Blockchain health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;
