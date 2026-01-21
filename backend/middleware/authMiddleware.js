/**
 * JWT Authentication Middleware
 * Verifies JWT tokens and attaches user data to request
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'iu-blockchain-secret-key-change-in-production';

/**
 * Middleware to verify JWT token
 * Usage: router.get('/protected', authenticateToken, (req, res) => { ... })
 */
const authenticateToken = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  // Verify token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Invalid or expired token:', err.message);
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Attach user data to request
    req.user = user;
    next();
  });
};

/**
 * Middleware to verify user role
 * Usage: router.post('/admin-only', authenticateToken, requireRole(['Admin']), (req, res) => { ... })
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Access denied for role: ${req.user.role}`);
      return res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole
};
