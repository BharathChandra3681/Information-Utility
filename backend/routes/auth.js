/**
 * Authentication Routes
 * Handles user login and authentication with JWT
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// JWT Secret (In production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'iu-blockchain-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

/**
 * POST /api/auth/login
 * Login user and return user profile with ID
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and role are required'
      });
    }

    // Find user by email and role
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      role: role.trim()
    });

    if (!user) {
      logger.warn(`Login failed: User not found - ${email} with role ${role}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials or role'
      });
    }

    // Check password (in production, use bcrypt.compare)
    if (user.password !== password) {
      logger.warn(`Login failed: Invalid password for ${email}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials or role'
      });
    }

    // Check if user is active
    if (!user.active) {
      return res.status(403).json({
        success: false,
        error: 'Account is inactive. Please contact administrator.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        role: user.role,
        organization: user.organization
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user data (without password) and token
    const userData = user.toSafeObject();

    logger.info(`User logged in successfully: ${user.email} (${user.userId})`);

    res.json({
      success: true,
      message: 'Login successful',
      user: userData,
      token: token
    });

  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
});

/**
 * GET /api/auth/users
 * Get list of all active users (for dropdowns, etc.)
 * Query params: ?role=Corporate Debtor (optional filter by role)
 */
router.get('/users', async (req, res, next) => {
  try {
    const { role } = req.query;

    const query = { active: true };
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password -__v')
      .sort({ organization: 1 });

    res.json({
      success: true,
      count: users.length,
      users: users
    });

  } catch (error) {
    logger.error('Error fetching users:', error);
    next(error);
  }
});

/**
 * GET /api/auth/users/:userId
 * Get specific user by ID
 */
router.get('/users/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId })
      .select('-password -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user
    });

  } catch (error) {
    logger.error('Error fetching user:', error);
    next(error);
  }
});

module.exports = router;
