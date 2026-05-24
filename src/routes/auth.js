const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db')
const { logAudit } = require('../utils/audit');
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
		// Find user by username
		const result = await pool.query('SELECT user_id, username, password_hash, role FROM users where username = $1', [username]);
		if (result.rows.length === 0) {
			// Log failed login attempt (USERNAME NOT FOUND) :<
			await logAudit(null, 'login_failed', 'auth', false, req.ip, { username, reason: 'user_not_found' });
			return res.status(401).json({
				error: 'Invalid username or password.'
			});
		}

		const user = result.rows[0];

		const validPassword = await bcrypt.compare(password, user.password_hash);
		if (!validPassword) {
			// Log failed login attempt (PASSWORD INCORRECT) :<
			await logAudit(user.user_id, 'login_failed', 'auth', false, req.ip, { username, reason: 'invalid_password' });
			return res.status(401).json({
				error: 'Invalid username or password.'
			});
		}

		const token = jwt.sign(
			{
				user_id: user.user_id,
				username: user.username,
				role: user.role
			},
			process.env.JWT_SECRET,
			{
				expiresIn: process.env.JWT_EXPIRES_IN || '12h'
			}
		);

		// Log successful login :>
		await logAudit(user.user_id, 'login_success', 'auth', true, req.ip, { username });
		
		res.json({
			token,
			user: {
				user_id: user.user_id,
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
 * Log the logout event (token invalidation handled client-side)
 */
router.post('/logout', authenticatetoken, async (req, res) => {
	try {
		await logAudit(req.user.user_id, 'logout', 'auth', true, req.ip, { username: req.user.username });
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
