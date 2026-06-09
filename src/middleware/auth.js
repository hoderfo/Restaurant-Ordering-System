const jwt = require('jsonwebtoken');
const auditService = require('../services/audit.service');

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
    // Log authentication failure
    auditService.logAction(
      null,
      'AUTH_FAILED',
      'token_validation',
      false,
      req.ip,
      { error: error.message }
    );

    return res.status(403).json({ 
      error: 'Invalid or expired token.' 
    });
  }
}

module.exports = { authenticateToken };
