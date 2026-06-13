const adminService = require('../services/admin.service');
const auditService = require('../services/audit.service');

// Import existing controllers for reuse
const tableController = require('./table.controller');
const menuController = require('./menu.controller');
const orderController = require('./order.controller');
const reservationController = require('./reservation.controller');

// Get all users with activity
async function getAllUsers(req, res) {
  try {
    const users = await adminService.getAllUsers();

    await auditService.logAction(
      req.user.user_id,
      'ADMIN_VIEW_USERS',
      'admin_panel',
      true,
      req.ip
    );

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
}

// Create new staff account
async function createUser(req, res) {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Username, password, and role are required'
      });
    }

    const user = await adminService.createUser(
      username,
      password,
      role,
      req.ip,
      req.user.user_id
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

// Update user role
async function updateUserRole(req, res) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role is required'
      });
    }

    const user = await adminService.updateUserRole(
      parseInt(userId),
      role,
      req.ip,
      req.user.user_id
    );

    res.json({
      success: true,
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

// Reset user password
async function resetUserPassword(req, res) {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password is required'
      });
    }

    const result = await adminService.resetUserPassword(
      parseInt(userId),
      newPassword,
      req.ip,
      req.user.user_id
    );

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

// Delete user account
async function deleteUser(req, res) {
  try {
    const { userId } = req.params;

    const result = await adminService.deleteUser(
      parseInt(userId),
      req.ip,
      req.user.user_id
    );

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

// Just call existing function :>>>
async function getTables(req, res) {
  return tableController.getTables(req, res);
}

async function createTable(req, res) {
  return tableController.createTable(req, res);
}

async function updateTable(req, res) {
  return tableController.updateTable(req, res);
}

async function deleteTable(req, res) {
  return tableController.deleteTable(req, res);
}

async function getMenuItems(req, res) {
  return menuController.getMenuItems(req, res);
}

async function createMenuItem(req, res) {
  return menuController.createMenuItem(req, res);
}

async function updateMenuItem(req, res) {
  return menuController.updateMenuItem(req, res);
}

async function deleteMenuItem(req, res) {
  return menuController.deleteMenuItem(req, res);
}

async function getReservations(req, res) {
  return reservationController.getReservations(req, res);
}

async function getOrders(req, res) {
  return orderController.getKitchenOrders(req, res);
}

// Get admin dashboard
async function getAdminDashboard(req, res) {
  try {
    const dashboard = await adminService.getAdminDashboard();

    await auditService.logAction(
      req.user.user_id,
      'ADMIN_VIEW_DASHBOARD',
      'admin_panel',
      true,
      req.ip
    );

    res.json({
      success: true,
      ...dashboard
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin dashboard'
    });
  }
}

// Get activity summary
async function getActivitySummary(req, res) {
  try {
    const { days = 7 } = req.query;

    const summary = await adminService.getActivitySummary(parseInt(days));

    res.json({
      success: true,
      ...summary
    });
  } catch (error) {
    console.error('Activity summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity summary'
    });
  }
}

// Get system health
async function getSystemHealth(req, res) {
  try {
    const health = await adminService.getSystemHealth();

    res.json({
      success: true,
      health
    });
  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system health'
    });
  }
}

module.exports = {
  getAllUsers,
  createUser,
  updateUserRole,
  resetUserPassword,
  deleteUser,

  getTables,
  createTable,
  updateTable,
  deleteTable,

  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,

  getReservations,
  getOrders,

  getAdminDashboard,
  getActivitySummary,
  getSystemHealth
};
