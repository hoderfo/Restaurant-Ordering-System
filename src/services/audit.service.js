const prisma = require('../config/db');

class AuditService {
  // Log an action to audit trail
  async logAction(userId, action, resource, success, ipAddress, details = {}) {
    try {
      const log = await prisma.auditLog.create({
        data: {
          userId,
          action,
          resource,
          success,
          ipAddress,
          details
        },
        include: {
          user: {
            select: { username: true }
          }
        }
      });

      return log;
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Don't throw - audit logging failure shouldn't break the app :>
    }
  }

  // Get recent audit logs
  async getRecentLogs(limit = 100) {
    return prisma.auditLog.findMany({
      include: {
        user: {
          select: { username: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }

  // Get logs for specific user
  async getUserLogs(userId, limit = 50) {
    return prisma.auditLog.findMany({
      where: { userId },
      include: {
        user: {
          select: { username: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }

  // Get logs for specific action
  async getActionLogs(action, limit = 100) {
    return prisma.auditLog.findMany({
      where: { action },
      include: {
        user: {
          select: { username: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }

  // Get failed login attempts
  async getFailedLogins(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return prisma.auditLog.findMany({
      where: {
        action: 'LOGIN_FAILED',
        timestamp: { gte: startDate }
      },
      include: {
        user: {
          select: { username: true }
        }
      },
      orderBy: { timestamp: 'desc' }
    });
  }

  // Get access denied events
  async getAccessDenials(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return prisma.auditLog.findMany({
      where: {
        action: 'ACCESS_DENIED',
        timestamp: { gte: startDate }
      },
      include: {
        user: {
          select: { username: true }
        }
      },
      orderBy: { timestamp: 'desc' }
    });
  }
}

module.exports = new AuditService();
