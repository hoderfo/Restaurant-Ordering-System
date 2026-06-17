const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock Prisma entirely so no real DB is needed
jest.mock('../../src/config/db', () => ({
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  table: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  },
  menuItem: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  },
  order: { count: jest.fn(), findFirst: jest.fn() },
  orderItem: { findMany: jest.fn() },
  reservation: { count: jest.fn(), findMany: jest.fn() },
  bill: { aggregate: jest.fn() },
  auditLog: {
    create: jest.fn().mockResolvedValue({}),
    findFirst: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0)
  },
  $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }])
}));

process.env.JWT_SECRET = 'test-secret-key';
process.env.PORT = '0';

const app = require('../../src/server').app;
const prisma = require('../../src/config/db');

const makeToken = (role, userId = 1) =>
  jwt.sign({ user_id: userId, username: `test_${role}`, role }, 'test-secret-key', { expiresIn: '1h' });

const adminToken = makeToken('admin', 1);
const managerToken = makeToken('management', 2);
const floorToken = makeToken('floor', 3);

beforeEach(() => jest.clearAllMocks());

describe('Admin route auth guards', () => {
  test('GET /api/admin/dashboard → 401 without token', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
  });

  test('GET /api/admin/dashboard → 403 for management role', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res.status).toBe(403);
  });

  test('GET /api/admin/dashboard → 403 for floor role', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${floorToken}`);
    expect(res.status).toBe(403);
  });

  test('GET /api/admin/users → 401 without token', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/admin/users', () => {
  test('returns users list for admin', async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: 1, username: 'admin', role: 'admin', createdAt: new Date() },
      { id: 2, username: 'floor1', role: 'floor', createdAt: new Date() }
    ]);
    prisma.auditLog.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.users).toHaveLength(2);
    expect(res.body.count).toBe(2);
  });
});

describe('POST /api/admin/users', () => {
  test('creates user successfully', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 10, username: 'newfloor', role: 'floor', createdAt: new Date()
    });

    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'newfloor', password: 'pass123', role: 'floor' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe('newfloor');
  });

  test('returns 400 when username missing', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ password: 'pass123', role: 'floor' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 400 when username already taken', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 5, username: 'existing' });

    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'existing', password: 'pass123', role: 'floor' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already exists/);
  });

  test('returns 400 for invalid role', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'newuser', password: 'pass123', role: 'superadmin' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid role/);
  });
});

describe('PUT /api/admin/users/:userId/role', () => {
  test('updates role successfully', async () => {
    prisma.user.findUnique.mockResolvedValue({ username: 'floor1' });
    prisma.user.update.mockResolvedValue({ id: 2, username: 'floor1', role: 'management' });

    const res = await request(app)
      .put('/api/admin/users/2/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'management' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('management');
  });

  test('returns 400 when role is missing', async () => {
    const res = await request(app)
      .put('/api/admin/users/2/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('POST /api/admin/users/:userId/reset-password', () => {
  test('resets password successfully', async () => {
    prisma.user.findUnique.mockResolvedValue({ username: 'floor1' });
    prisma.user.update.mockResolvedValue({ id: 2 });

    const res = await request(app)
      .post('/api/admin/users/2/reset-password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ newPassword: 'newpass123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('returns 400 when newPassword is missing', async () => {
    const res = await request(app)
      .post('/api/admin/users/2/reset-password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/admin/users/:userId', () => {
  test('deletes another user successfully', async () => {
    prisma.user.findUnique.mockResolvedValue({ username: 'floor1' });
    prisma.user.delete.mockResolvedValue({});

    const res = await request(app)
      .delete('/api/admin/users/2') // admin is user 1, deleting user 2
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('returns 400 when trying to delete own account', async () => {
    const res = await request(app)
      .delete('/api/admin/users/1') // admin is user 1, deleting themselves
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Cannot delete your own account/);
  });
});

describe('GET /api/admin/tables', () => {
  test('returns all tables for admin', async () => {
    const mockTables = [
      { id: 1, label: 'T1', capacity: 2, status: 'AVAILABLE', createdAt: new Date(), isActive: true },
      { id: 2, label: 'T2', capacity: 4, status: 'OCCUPIED', createdAt: new Date(), isActive: true }
    ];
    prisma.table.findMany.mockResolvedValue(mockTables);

    const res = await request(app)
      .get('/api/admin/tables')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tables).toHaveLength(2);
  });
});

describe('POST /api/admin/tables', () => {
  test('creates table successfully', async () => {
    prisma.table.findUnique.mockResolvedValue(null);
    prisma.table.create.mockResolvedValue({
      id: 9, label: 'T9', capacity: 6, status: 'AVAILABLE', createdAt: new Date(), isActive: true
    });

    const res = await request(app)
      .post('/api/admin/tables')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ label: 'T9', capacity: 6 });

    expect(res.status).toBe(201);
    expect(res.body.table.label).toBe('T9');
  });

  test('returns 400 when label already exists', async () => {
    prisma.table.findUnique.mockResolvedValue({ id: 1, label: 'T1' });

    const res = await request(app)
      .post('/api/admin/tables')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ label: 'T1', capacity: 4 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/);
  });
});

describe('GET /api/admin/dashboard', () => {
  test('returns dashboard with correct shape for admin', async () => {
    prisma.user.count.mockResolvedValue(6);
    prisma.table.count.mockResolvedValue(8);
    prisma.menuItem.count.mockResolvedValue(13);
    prisma.order.count.mockResolvedValue(10);
    prisma.reservation.count.mockResolvedValue(2);
    prisma.bill.aggregate.mockResolvedValue({ _sum: { total: 500.00 } });
    prisma.auditLog.count.mockResolvedValue(0);
    prisma.auditLog.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    expect(res.body).toHaveProperty('systemStats');
    expect(res.body).toHaveProperty('todayMetrics');
    expect(res.body.systemStats.totalUsers).toBe(6);
    expect(res.body.todayMetrics.revenue).toBe(500);
  });
});

describe('GET /api/admin/activity', () => {
  test('returns activity with recentActivity array', async () => {
    prisma.auditLog.count.mockResolvedValue(0);
    prisma.auditLog.findMany.mockResolvedValue([
      { id: 1, userId: 1, action: 'LOGIN_SUCCESS', resource: 'auth',
        success: true, ipAddress: '127.0.0.1', timestamp: new Date(),
        details: {}, user: { username: 'admin' } }
    ]);

    const res = await request(app)
      .get('/api/admin/activity')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    // BUG 1 FIX: recentActivity must exist in response
    expect(res.body).toHaveProperty('recentActivity');
    expect(Array.isArray(res.body.recentActivity)).toBe(true);
  });
});

describe('GET /api/admin/health', () => {
  test('returns system health metrics', async () => {
    const res = await request(app)
      .get('/api/admin/health')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.health).toHaveProperty('status');
    expect(res.body.health).toHaveProperty('memoryUsage');
    expect(res.body.health).toHaveProperty('uptime');
  });
});
