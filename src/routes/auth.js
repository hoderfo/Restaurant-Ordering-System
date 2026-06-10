const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const auditService = require('../services/audit.service');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: 'Username and password are required.'
    });
  }

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      // Log failed attempt
      await auditService.logAction(null, 'LOGIN_FAILED', 'auth', false, req.ip, {
        username,
        reason: 'user_not_found'
      });

      return res.status(401).json({
        error: 'Invalid username or password.'
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      // Log failed attempt
      await auditService.logAction(user.id, 'LOGIN_FAILED', 'auth', false, req.ip, {
        username,
        reason: 'invalid_password'
      });

      return res.status(401).json({
        error: 'Invalid username or password.'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        user_id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
    );

    // Log successful login
    await auditService.logAction(user.id, 'LOGIN_SUCCESS', 'auth', true, req.ip, { username });

    res.json({
      token,
      user: {
        user_id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error during login.'
    });
  }
});

/**
 * POST /api/auth/logout
 * Log the logout event
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    await logAudit(
      req.user.user_id,
      'LOGOUT',
      'auth',
      true,
      req.ip,
      { username: req.user.username }
    );

    res.json({
      message: 'Logged out successfully.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal server error during logout.'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info from token
 */
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      user_id: req.user.user_id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

module.exports = router;
