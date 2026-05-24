const pool = require('../config/db');

async function logAudit(userId, action, resource, success, ipAddress, details = {}) {
	try {
		await pool.query('INSERT INTO audit_log(user_id, action, resource, success, ip_address, details) VALUES ($1, $2, $3, $4, $5, $6)', [userId, action, resource, success, ipAddress, JSON.stringify(details)]);
	} catch (error) {
		console.error('Failed to write audit log:', error); // Not throwing - audit logging errors shouldn't break the app :>
	}
}

module.exports = { logAudit };
