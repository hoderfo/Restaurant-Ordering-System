const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireRole, ROLES } = require('../middleware/rbac');
const adminController = require('../controllers/admin.controller');
const settingController = require('../controllers/setting.controller');

router.use(authenticateToken, requireRole(ROLES.ADMIN));


/**
 * GET /api/admin/dashboard
 * Admin system overview
 */
router.get('/dashboard', adminController.getAdminDashboard);

/**
 * GET /api/admin/activity
 * Activity summary (logins, changes, etc)
 */
router.get('/activity', adminController.getActivitySummary);

/**
 * GET /api/admin/health
 * System health metrics
 */
router.get('/health', adminController.getSystemHealth);

/**
 * GET /api/admin/users
 * Get all staff accounts
 */
router.get('/users', adminController.getAllUsers);

/**
 * POST /api/admin/users
 * Create new staff account
 */
router.post('/users', adminController.createUser);

/**
 * PUT /api/admin/users/:userId/role
 * Update staff member role
 */
router.put('/users/:userId/role', adminController.updateUserRole);

/**
 * POST /api/admin/users/:userId/reset-password
 * Reset staff member password
 */
router.post('/users/:userId/reset-password', adminController.resetUserPassword);

/**
 * DELETE /api/admin/users/:userId
 * Delete staff account
 */
router.delete('/users/:userId', adminController.deleteUser);

/**
 * GET /api/admin/tables
 * Get all restaurant tables
 */
router.get('/tables', adminController.getTables);

/**
 * POST /api/admin/tables
 * Create new table
 */
router.post('/tables', adminController.createTable);

/**
 * PUT /api/admin/tables/:id
 * Update table (label, capacity, status)
 */
router.put('/tables/:id', adminController.updateTable);

/**
 * DELETE /api/admin/tables/:id
 * Deactivate table (soft delete, preserves history)
 */
router.delete('/tables/:id', adminController.deleteTable);

/**
 * GET /api/admin/menu
 * Get all menu items
 */
router.get('/menu', adminController.getMenuItems);

/**
 * POST /api/admin/menu
 * Create menu item
 */
router.post('/menu', adminController.createMenuItem);

/**
 * PUT /api/admin/menu/:id
 * Update menu item
 */
router.put('/menu/:id', adminController.updateMenuItem);

/**
 * DELETE /api/admin/menu/:id
 * Delete menu item
 */
router.delete('/menu/:id', adminController.deleteMenuItem);

/**
 * GET /api/admin/reservations
 * Get all reservations (admin view)
 */
router.get('/reservations', adminController.getReservations);

/**
 * GET /api/admin/orders
 * Get all orders (kitchen view for admin)
 */
router.get('/orders', adminController.getOrders);

// Settings management
router.get('/settings', requireRole(ROLES.ADMIN), settingController.getSettings);
router.put('/settings', requireRole(ROLES.ADMIN), settingController.updateSetting);

module.exports = router;
