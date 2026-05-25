const jwt = require('jsonwebtoken');
const { logAudit } = require('../utils/audit');

function authenticateToken(req, res, next) {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];
	if (!token) {
		return res.status(401).json({
			error: 'Access denied. No token provided.'
		});
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = {
			user_id: decoded.user_id,
			username: decoded.username,
			role: decoded.role
		};
		next();
	} catch (error) {
		logAudit(null, 'auth_failed', 'token_validation', false, req.ip, { error: error.message });
		return res.status(403).json({ error: 'Invalid token.' });
	}
}

module.exports = { authenticateToken };
