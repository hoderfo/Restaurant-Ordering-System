const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireRole, ROLES } = require('../middleware/rbac');
const {
  getDashboard,
  getAuditLog,
  getDailyReport,
  getWeeklyReport,
  exportPDF
} = require('../controllers/analytics.controller');

/**
 * GET /api/analytics/dashboard
 * Real-time dashboard (management+ only)
 */
router.get('/dashboard', authenticateToken, requireRole(ROLES.MANAGEMENT), getDashboard);

/**
 * GET /api/analytics/audit-log
 * Audit log viewer (admin only)
 */
router.get('/audit-log', authenticateToken, requireRole(ROLES.ADMIN), getAuditLog);

/**
 * GET /api/reports/daily
 * Daily report (management+ only)
 */
router.get('/daily', authenticateToken, requireRole(ROLES.MANAGEMENT), getDailyReport);

/**
 * GET /api/reports/weekly
 * Weekly report (management+ only)
 */
router.get('/weekly', authenticateToken, requireRole(ROLES.MANAGEMENT), getWeeklyReport);

/**
 * POST /api/reports/export/pdf
 * Export report as PDF (management+ only)
 */
router.post('/export/pdf', authenticateToken, requireRole(ROLES.MANAGEMENT), exportPDF);

module.exports = router;
