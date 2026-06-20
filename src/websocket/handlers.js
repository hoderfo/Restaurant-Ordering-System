const analyticsService = require('../services/analytics.service');
const auditService = require('../services/audit.service');
const reportsService = require('../services/reports.service');
const prisma = require('../config/db');

// Handle WebSocket connections (I LOVE MIGRATIONS >:c)
function setupWebSocketHandlers(io) {
  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = {
        user_id: decoded.user_id,
        username: decoded.username,
        role: decoded.role
      };
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', async (socket) => {
    console.log(`User ${socket.user.username} connected: ${socket.id}`);

    // Update status to active
    try {
      await prisma.user.update({
        where: { id: socket.user.user_id },
        data: { isActive: true }
      });
      broadcastUserStatus(io, socket.user.user_id, true);
    } catch (error) {
      console.error('Failed to set active status:', error);
    }

    socket.on('dashboard:subscribe', async (data) => {
      const { date = new Date().toISOString().split('T')[0] } = data;

      // Check permission
      if (!['admin', 'management'].includes(socket.user.role)) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      // Join room
      socket.join(`dashboard:${date}`);

      try {
        // Send initial data
        const metrics = await analyticsService.getDashboardMetrics(date);
        socket.emit('dashboard:metrics', metrics);

        // Log subscription
        console.log(`${socket.user.username} subscribed to dashboard: ${date}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to fetch dashboard' });
        console.error('Dashboard subscription error:', error);
      }
    });

    socket.on('auditlog:subscribe', async (data) => {
      const { action = null, days = 7 } = data;

      // Admin only
      if (socket.user.role !== 'admin') {
        socket.emit('error', { message: 'Admin access required' });
        return;
      }

      socket.join('auditlog');

      try {
        const logs = await auditService.getRecentLogs(100);
        socket.emit('auditlog:history', { logs, count: logs.length });
        console.log(`📋 ${socket.user.username} subscribed to audit log`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to fetch audit logs' });
        console.error('Audit log subscription error:', error);
      }
    });

    socket.on('report:generate', async (data) => {
      const { type = 'daily', date = new Date().toISOString().split('T')[0] } = data;

      // Check permission
      if (!['admin', 'management'].includes(socket.user.role)) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      try {
        socket.emit('report:generating', { type, date });

        let reportData;
        if (type === 'weekly') {
          reportData = await reportsService.generateWeeklyReport(date);
        } else {
          reportData = await reportsService.generateDailyReport(date);
        }

        socket.emit('report:generated', { type, date, data: reportData });
        console.log(`${socket.user.username} generated ${type} report`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to generate report' });
        console.error('Report generation error:', error);
      }
    });

    socket.on('disconnect', async () => {
      console.log(`User ${socket.user.username} disconnected`);
      
      // Update status to inactive
      try {
        await prisma.user.update({
          where: { id: socket.user.user_id },
          data: { isActive: false }
        });
        broadcastUserStatus(io, socket.user.user_id, false);
      } catch (error) {
        console.error('Failed to set inactive status:', error);
      }
    });
  });

  return io;
}

/**
 * Broadcast dashboard update to all connected clients
 * Call this when an order is placed/closed to update all dashboards
 */
async function broadcastDashboardUpdate(io, date) {
  try {
    const metrics = await analyticsService.getDashboardMetrics(date);
    io.to(`dashboard:${date}`).emit('dashboard:update', metrics);
  } catch (error) {
    console.error('Failed to broadcast dashboard update:', error);
  }
}

/**
 * Broadcast new audit log entry to all admins
 * Call this after logging any action
 */
function broadcastAuditLog(io, logEntry) {
  io.to('auditlog').emit('auditlog:new', logEntry);
}

/**
 * Broadcast user status change
 */
function broadcastUserStatus(io, userId, isActive) {
  io.emit('user:status_update', { userId, isActive });
}

module.exports = {
  setupWebSocketHandlers,
  broadcastDashboardUpdate,
  broadcastAuditLog,
  broadcastUserStatus
};
