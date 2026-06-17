jest.mock('../../src/config/db', () => ({
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  table: { count: jest.fn() },
  menuItem: { count: jest.fn() },
  order: { count: jest.fn() },
  reservation: { count: jest.fn() },
  bill: { aggregate: jest.fn() },
  auditLog: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn()
  }
}));

jest.mock('../../src/services/audit.service', () => ({
  logAction: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password_123'),
  compare: jest.fn()
}));

const prisma = require('../../src/config/db');
const adminService = require('../../src/services/admin.service');

beforeEach(() => jest.clearAllMocks());

describe('AdminService.getAllUsers()', () => {
  test('returns users enriched with last activity', async () => {
    const mockUsers = [
      { id: 1, username: 'admin', role: 'admin', createdAt: new Date() },
      { id: 2, username: 'floor1', role: 'floor', createdAt: new Date() }
    ];

    prisma.user.findMany.mockResolvedValue(mockUsers);
    prisma.auditLog.findFirst
      .mockResolvedValueOnce({ action: 'LOGIN_SUCCESS', timestamp: new Date('2024-01-15T10:00:00Z') })
      .mockResolvedValueOnce(null);

    const result = await adminService.getAllUsers();

    expect(result).toHaveLength(2);
    expect(result[0].lastAction).toBe('LOGIN_SUCCESS');
    expect(result[1].lastAction).toBeUndefined();
    expect(result[1].lastActivityAt).toBeUndefined();
  });

  test('returns empty array when no users exist', async () => {
    prisma.user.findMany.mockResolvedValue([]);
    const result = await adminService.getAllUsers();
    expect(result).toEqual([]);
  });
});

describe('AdminService.createUser()', () => {
  const adminId = 1;
  const ip = '127.0.0.1';

  test('creates user successfully with valid inputs', async () => {
    prisma.user.findUnique.mockResolvedValue(null); // username not taken
    prisma.user.create.mockResolvedValue({
      id: 10, username: 'newstaff', role: 'floor', createdAt: new Date()
    });

    const result = await adminService.createUser('newstaff', 'pass123', 'floor', ip, adminId);

    expect(result.username).toBe('newstaff');
    expect(result.role).toBe('floor');
    expect(require('bcrypt').hash).toHaveBeenCalledWith('pass123', 10);
  });

  test('throws when username already exists', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 5, username: 'existing' });

    await expect(
      adminService.createUser('existing', 'pass123', 'floor', ip, adminId)
    ).rejects.toThrow('Username already exists');
  });

  test('throws on invalid role', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      adminService.createUser('newuser', 'pass123', 'superadmin', ip, adminId)
    ).rejects.toThrow('Invalid role');
  });

  test('throws when username is empty', async () => {
    await expect(
      adminService.createUser('', 'pass123', 'floor', ip, adminId)
    ).rejects.toThrow('Username, password, and role are required');
  });

  test('accepts all valid roles', async () => {
    const validRoles = ['admin', 'management', 'floor', 'kitchen'];

    for (const role of validRoles) {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 1, username: 'test', role, createdAt: new Date() });

      const result = await adminService.createUser(`user_${role}`, 'pass123', role, ip, adminId);
      expect(result.role).toBe(role);
    }
  });
});

describe('AdminService.updateUserRole()', () => {
  test('updates role successfully', async () => {
    prisma.user.findUnique.mockResolvedValue({ username: 'floor1' });
    prisma.user.update.mockResolvedValue({ id: 2, username: 'floor1', role: 'management' });

    const result = await adminService.updateUserRole(2, 'management', '127.0.0.1', 1);
    expect(result.role).toBe('management');
  });

  test('throws when user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      adminService.updateUserRole(999, 'floor', '127.0.0.1', 1)
    ).rejects.toThrow('User not found');
  });

  test('throws on invalid role', async () => {
    await expect(
      adminService.updateUserRole(2, 'cashier', '127.0.0.1', 1)
    ).rejects.toThrow('Invalid role');
  });
});

describe('AdminService.resetUserPassword()', () => {
  test('resets password successfully', async () => {
    prisma.user.findUnique.mockResolvedValue({ username: 'floor1' });
    prisma.user.update.mockResolvedValue({ id: 2 });

    const result = await adminService.resetUserPassword(2, 'newpassword123', '127.0.0.1', 1);
    expect(result.success).toBe(true);
    expect(require('bcrypt').hash).toHaveBeenCalledWith('newpassword123', 10);
  });

  test('throws when password is too short', async () => {
    await expect(
      adminService.resetUserPassword(2, 'abc', '127.0.0.1', 1)
    ).rejects.toThrow('at least 6 characters');
  });

  test('throws when user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      adminService.resetUserPassword(999, 'newpassword123', '127.0.0.1', 1)
    ).rejects.toThrow('User not found');
  });
});

describe('AdminService.deleteUser()', () => {
  test('deletes user successfully', async () => {
    prisma.user.findUnique.mockResolvedValue({ username: 'floor1' });
    prisma.user.delete.mockResolvedValue({});

    const result = await adminService.deleteUser(2, '127.0.0.1', 1);
    expect(result.success).toBe(true);
  });

  test('throws when admin tries to delete themselves', async () => {
    await expect(
      adminService.deleteUser(1, '127.0.0.1', 1) // userId === adminId
    ).rejects.toThrow('Cannot delete your own account');
  });

  test('throws when user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      adminService.deleteUser(999, '127.0.0.1', 1)
    ).rejects.toThrow('User not found');
  });
});

describe('AdminService.getAdminDashboard()', () => {
  test('returns correctly shaped dashboard object', async () => {
    prisma.user.count.mockResolvedValue(6);
    prisma.table.count.mockResolvedValue(8);
    prisma.menuItem.count.mockResolvedValue(13);
    prisma.order.count.mockResolvedValue(5);
    prisma.reservation.count.mockResolvedValue(3);
    prisma.bill.aggregate.mockResolvedValue({ _sum: { total: 450.50 } });
    prisma.auditLog.count.mockResolvedValue(2);
    prisma.auditLog.findMany.mockResolvedValue([]);

    const result = await adminService.getAdminDashboard();

    expect(result).toHaveProperty('systemStats');
    expect(result).toHaveProperty('todayMetrics');
    expect(result.systemStats.totalUsers).toBe(6);
    expect(result.systemStats.totalTables).toBe(8);
    expect(result.systemStats.totalMenuItems).toBe(13);
    expect(result.todayMetrics.revenue).toBe(450.5);
    expect(result.todayMetrics.failedLoginAttempts).toBe(2);
  });

  test('handles zero revenue gracefully', async () => {
    prisma.user.count.mockResolvedValue(0);
    prisma.table.count.mockResolvedValue(0);
    prisma.menuItem.count.mockResolvedValue(0);
    prisma.order.count.mockResolvedValue(0);
    prisma.reservation.count.mockResolvedValue(0);
    prisma.bill.aggregate.mockResolvedValue({ _sum: { total: null } });
    prisma.auditLog.count.mockResolvedValue(0);
    prisma.auditLog.findMany.mockResolvedValue([]);

    const result = await adminService.getAdminDashboard();
    expect(result.todayMetrics.revenue).toBe(0);
  });
});

describe('AdminService.getActivitySummary()', () => {
  test('returns activity with recentActivity array', async () => {
    prisma.auditLog.count
      .mockResolvedValueOnce(10) // LOGIN_SUCCESS
      .mockResolvedValueOnce(2) // LOGIN_FAILED
      .mockResolvedValueOnce(1) // ACCESS_DENIED
      .mockResolvedValueOnce(3); // data modifications

    const mockLogs = [
      { id: 1, userId: 1, action: 'LOGIN_SUCCESS', resource: 'auth', success: true,
        ipAddress: '127.0.0.1', timestamp: new Date(), details: {}, user: { username: 'admin' } }
    ];
    prisma.auditLog.findMany.mockResolvedValue(mockLogs);

    const result = await adminService.getActivitySummary(7);

    expect(result).toHaveProperty('recentActivity');
    expect(result.recentActivity).toHaveLength(1);
    expect(result.loginAttempts.successful).toBe(10);
    expect(result.loginAttempts.failed).toBe(2);
    expect(result.accessDenials).toBe(1);
  });
});

describe('AdminService.getSystemHealth()', () => {
  test('returns healthy status under normal memory usage', async () => {
    const result = await adminService.getSystemHealth();

    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('memoryUsage');
    expect(result).toHaveProperty('uptime');
    expect(['healthy', 'warning', 'critical']).toContain(result.status);
    expect(result.memoryUsage).toBeGreaterThan(0);
  });
});
