const { logAudit } = require('../utils/audit');

function requireRole(allowedRoles) {
	return (req, res, next) => {
		const userRole = req.user?.role;
		if (!userRole) {
			return res.status(401).json({
				error: 'Authentication required.'
			});
		}
		if (!allowedRoles.includes(userRole)) {
			// Log unauthorized access attempt
			logAudit(req.user.user_id, 'access_denied', req.path, false, req.ip, { required_roles: allowedRoles, user_role: userRole, method: req.method });
			return res.status(403).json({
				error: `Access denied. Required role(s): ${allowedRoles.join(' or ')}`
			});
		}
		next();
	};
}

const ROLES = {
	ADMIN: ['admin'],
	MANAGEMENT: ['admin', 'management'],
	FLOOR_AND_MANAGEMENT: ['admin', 'management', 'floor'],
	KITCHEN_AND_MANAGEMENT: ['admin', 'management', 'kitchen'],
	ALL_STAFF: ['admin', 'management', 'floor', 'kitchen']
};
 
module.exports = { requireRole, ROLES };
