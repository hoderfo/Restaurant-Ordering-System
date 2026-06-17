const prisma = require('../config/db');
const bcrypt = require('bcrypt');
const auditService = require('./audit.service');

class AdminService {
  // Get all users with their activity
  async getAllUsers() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Enrich with recent activity
    const usersWithActivity = await Promise.all(
      users.map(async (user) => {
        const recentAction = await prisma.auditLog.findFirst({
          where: { userId: user.id },
          orderBy: { timestamp: 'desc' },
          select: { action: true, timestamp: true }
        });

        return {
          ...user,
          lastAction: recentAction?.action,
          lastActivityAt: recentAction?.timestamp
        };
      })
    );

    return usersWithActivity;
  }

  // Create new staff account
  async createUser(username, password, role, ipAddress, adminId) {
    try {
      if (!username || !password || !role) {
        throw new Error('Username, password, and role are required');
      }

      const existing = await prisma.user.findUnique({
        where: { username }
      });

      if (existing) {
        throw new Error('Username already exists');
      }

      const validRoles = ['admin', 'management', 'floor', 'kitchen'];
      if (!validRoles.includes(role)) {
        throw new Error(`Invalid role. Must be: ${validRoles.join(', ')}`);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          role
        },
        select: {
          id: true,
          username: true,
          role: true,
          createdAt: true
        }
      });

      await auditService.logAction(
        adminId,
        'USER_CREATED',
        `user_${user.id}`,
        true,
        ipAddress,
        { username, role }
      );

      return user;
    } catch (error) {
      await auditService.logAction(adminId, 'USER_CREATE_FAILED', 'user', false, ipAddress, {
        username,
        error: error.message
      });
      throw error;
    }
  }

  // Update user role
  async updateUserRole(userId, newRole, ipAddress, adminId) {
    try {
      const validRoles = ['admin', 'management', 'floor', 'kitchen'];
      if (!validRoles.includes(newRole)) {
        throw new Error(`Invalid role. Must be: ${validRoles.join(', ')}`);
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
        select: { id: true, username: true, role: true }
      });

      await auditService.logAction(
        adminId,
        'USER_ROLE_UPDATED',
        `user_${userId}`,
        true,
        ipAddress,
        { username: user.username, newRole }
      );

      return updated;
    } catch (error) {
      await auditService.logAction(adminId, 'USER_UPDATE_FAILED', `user_${userId}`, false, ipAddress, {
        error: error.message
      });
      throw error;
    }
  }

  // Reset user password
  async resetUserPassword(userId, newPassword, ipAddress, adminId) {
    try {
      if (!newPassword || newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      await auditService.logAction(
        adminId,
        'PASSWORD_RESET',
        `user_${userId}`,
        true,
        ipAddress,
        { username: user.username }
      );

      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      await auditService.logAction(adminId, 'PASSWORD_RESET_FAILED', `user_${userId}`, false, ipAddress, {
        error: error.message
      });
      throw error;
    }
  }

  // Delete user account
  async deleteUser(userId, ipAddress, adminId) {
    try {
      if (userId === adminId) {
        throw new Error('Cannot delete your own account');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      await prisma.user.delete({
        where: { id: userId }
      });

      await auditService.logAction(
        adminId,
        'USER_DELETED',
        `user_${userId}`,
        true,
        ipAddress,
        { username: user.username }
      );

      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      await auditService.logAction(adminId, 'USER_DELETE_FAILED', `user_${userId}`, false, ipAddress, {
        error: error.message
      });
      throw error;
    }
  }


  // Get admin dashboard overview
  async getAdminDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalUsers,
      totalTables,
      totalMenuItems,
      todayOrders,
      activeReservations,
      todayRevenue,
      failedLogins,
      systemHealth
    ] = await Promise.all([
      prisma.user.count(),
      prisma.table.count({ where: { isActive: true } }),
      prisma.menuItem.count({ where: { status: 'ACTIVE' } }),
      prisma.order.count({
        where: {
          createdAt: { gte: today, lt: tomorrow }
        }
      }),
      prisma.reservation.count({
        where: {
          status: { in: ['PENDING', 'SEATED'] }
        }
      }),
      prisma.bill.aggregate({
        where: {
          closedAt: { gte: today, lt: tomorrow }
        },
        _sum: { total: true }
      }),
      prisma.auditLog.count({
        where: {
          action: 'LOGIN_FAILED',
          timestamp: { gte: today, lt: tomorrow }
        }
      }),
      this.getSystemHealth()
    ]);
	const recentActivity = await prisma.auditLog.findMany({
	  include: { user: { select: { username: true } } },
	  orderBy: { timestamp: 'desc' },
	  take: 15
	});

    return {
      timestamp: new Date().toISOString(),
      systemStats: {
        totalUsers,
        totalTables,
        totalMenuItems,
        totalActiveReservations: activeReservations
      },
      todayMetrics: {
        orders: todayOrders,
        revenue: parseFloat((todayRevenue._sum.total || 0).toString()),
        failedLoginAttempts: failedLogins
      },
      health: systemHealth
    };
  }

  // Get system health metrics
  async getSystemHealth() {
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    return {
      status: heapUsedPercent > 90 ? 'critical' : heapUsedPercent > 80 ? 'warning' : 'healthy',
      memoryUsage: parseFloat(heapUsedPercent.toFixed(2)),
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    };
  }

  // Get activity summary
  async getActivitySummary(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalLogins,
      failedLogins,
      accessDenials,
      dataModifications
    ] = await Promise.all([
      prisma.auditLog.count({
        where: {
          action: 'LOGIN_SUCCESS',
          timestamp: { gte: startDate }
        }
      }),
      prisma.auditLog.count({
        where: {
          action: 'LOGIN_FAILED',
          timestamp: { gte: startDate }
        }
      }),
      prisma.auditLog.count({
        where: {
          action: 'ACCESS_DENIED',
          timestamp: { gte: startDate }
        }
      }),
      prisma.auditLog.count({
        where: {
          action: { in: ['USER_CREATED', 'TABLE_CREATED', 'MENU_ITEM_CREATED', 'MENU_ITEM_UPDATED'] },
          timestamp: { gte: startDate }
        }
      })
    ]);
  	const recentActivity = await prisma.auditLog.findMany({
      include: { user: { select: { username: true } } },
      orderBy: { timestamp: 'desc' },
      take: 50
  	});

    return {
      period: `Last ${days} days`,
      loginAttempts: {
        successful: totalLogins,
        failed: failedLogins
      },
      accessDenials,
      dataModifications,
	  recentActivity
    };
  }
}

module.exports = new AdminService();
