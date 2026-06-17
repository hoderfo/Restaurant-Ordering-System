jest.mock('../../src/config/db', () => {
  const db = {
    users: [
      { id: 1, username: 'admin',    password: '$2b$10$placeholder', role: 'admin',      createdAt: new Date() },
      { id: 2, username: 'manager1', password: '$2b$10$placeholder', role: 'management', createdAt: new Date() },
      { id: 3, username: 'floor1',   password: '$2b$10$placeholder', role: 'floor',      createdAt: new Date() },
      { id: 4, username: 'kitchen1', password: '$2b$10$placeholder', role: 'kitchen',    createdAt: new Date() },
    ],
    tables: [
      { id: 1, label: 'T1', capacity: 2, status: 'AVAILABLE', isActive: true, createdAt: new Date() },
      { id: 2, label: 'T2', capacity: 4, status: 'AVAILABLE', isActive: true, createdAt: new Date() },
    ],
    menuItems: [
      { id: 1, name: 'Foie Gras',   description: 'Duck liver', price: 8.5,  category: 'STARTER', status: 'ACTIVE',   createdAt: new Date() },
      { id: 2, name: 'Wagyu Steak', description: 'Premium',    price: 12.0, category: 'MAIN',    status: 'ACTIVE',   createdAt: new Date() },
      { id: 3, name: 'Old Item',    description: 'Retired',    price: 5.0,  category: 'DESSERT', status: 'INACTIVE', createdAt: new Date() },
    ],
    orders: [],
    reservations: [],
    bills: [],
    auditLogs: [],
    nextId: { user: 10, table: 10, menuItem: 10, auditLog: 10 },
  };

  const nid = (type) => db.nextId[type]++;

  // Apply a Prisma-style select projection to a plain object
  const applySelect = (obj, select) => {
    if (!select) return obj;
    return Object.fromEntries(Object.entries(obj).filter(([k]) => k in select));
  };

  const notFound = () => { const e = new Error('Record not found'); e.code = 'P2025'; return Promise.reject(e); };

  return {
    _db: db,

    user: {
      findMany: jest.fn(({ select } = {}) =>
        Promise.resolve(db.users.map(u => applySelect(u, select)))
      ),
      findUnique: jest.fn(({ where }) => {
        const u = db.users.find(u => where.id ? u.id === where.id : u.username === where.username);
        return Promise.resolve(u || null);
      }),
      create: jest.fn(({ data, select }) => {
        const user = { id: nid('user'), createdAt: new Date(), ...data };
        db.users.push(user);
        return Promise.resolve(applySelect(user, select));
      }),
      update: jest.fn(({ where, data, select }) => {
        const idx = db.users.findIndex(u => u.id === where.id);
        if (idx === -1) return notFound();
        db.users[idx] = { ...db.users[idx], ...data };
        return Promise.resolve(applySelect(db.users[idx], select));
      }),
      delete: jest.fn(({ where }) => {
        const idx = db.users.findIndex(u => u.id === where.id);
        if (idx === -1) return notFound();
        const [removed] = db.users.splice(idx, 1);
        return Promise.resolve(removed);
      }),
      count: jest.fn(() => Promise.resolve(db.users.length)),
    },

    table: {
      findMany: jest.fn(({ where } = {}) => {
        let r = [...db.tables];
        if (where?.isActive !== undefined) r = r.filter(t => t.isActive === where.isActive);
        return Promise.resolve(r);
      }),
      findUnique: jest.fn(({ where }) => {
        const t = db.tables.find(t => where.id ? t.id === where.id : t.label === where.label);
        return Promise.resolve(t || null);
      }),
      create: jest.fn(({ data }) => {
        const table = { id: nid('table'), isActive: true, createdAt: new Date(), ...data };
        db.tables.push(table);
        return Promise.resolve(table);
      }),
      update: jest.fn(({ where, data }) => {
        const idx = db.tables.findIndex(t => t.id === where.id);
        if (idx === -1) return notFound();
        db.tables[idx] = { ...db.tables[idx], ...data };
        return Promise.resolve(db.tables[idx]);
      }),
      count: jest.fn(({ where } = {}) => {
        let r = db.tables;
        if (where?.isActive !== undefined) r = r.filter(t => t.isActive === where.isActive);
        return Promise.resolve(r.length);
      }),
    },

    menuItem: {
      findMany: jest.fn(({ where } = {}) => {
        let r = [...db.menuItems];
        if (where?.status?.in) r = r.filter(m => where.status.in.includes(m.status));
        return Promise.resolve(r);
      }),
      findUnique: jest.fn(({ where }) =>
        Promise.resolve(db.menuItems.find(m => m.id === where.id) || null)
      ),
      create: jest.fn(({ data }) => {
        const item = { id: nid('menuItem'), createdAt: new Date(), ...data };
        db.menuItems.push(item);
        return Promise.resolve(item);
      }),
      update: jest.fn(({ where, data }) => {
        const idx = db.menuItems.findIndex(m => m.id === where.id);
        if (idx === -1) return notFound();
        db.menuItems[idx] = { ...db.menuItems[idx], ...data };
        return Promise.resolve(db.menuItems[idx]);
      }),
      count: jest.fn(({ where } = {}) => {
        let r = db.menuItems;
        if (where?.status) r = r.filter(m => m.status === where.status);
        return Promise.resolve(r.length);
      }),
    },

    order: {
      count: jest.fn(() => Promise.resolve(db.orders.length)),
    },

    orderItem: {
      findMany: jest.fn(() => Promise.resolve([])),
    },

    reservation: {
      findMany: jest.fn(() => Promise.resolve([...db.reservations])),
      count: jest.fn(() => Promise.resolve(db.reservations.length)),
    },

    bill: {
      aggregate: jest.fn(() => Promise.resolve({ _sum: { total: null } })),
    },

    auditLog: {
      create: jest.fn(({ data }) => {
        const log = { id: nid('auditLog'), timestamp: new Date(), user: null, ...data };
        db.auditLogs.push(log);
        return Promise.resolve(log);
      }),
      findFirst: jest.fn(({ where } = {}) => {
        const logs = where?.userId
          ? db.auditLogs.filter(l => l.userId === where.userId)
          : db.auditLogs;
        return Promise.resolve(logs[logs.length - 1] || null);
      }),
      findMany: jest.fn(({ take } = {}) => {
        let logs = [...db.auditLogs].reverse();
        if (take) logs = logs.slice(0, take);
        return Promise.resolve(logs.map(l => ({ ...l, user: null })));
      }),
      count: jest.fn(({ where } = {}) => {
        let logs = db.auditLogs;
        if (where?.action) {
          if (typeof where.action === 'string') logs = logs.filter(l => l.action === where.action);
          else if (where.action.in) logs = logs.filter(l => where.action.in.includes(l.action));
        }
        return Promise.resolve(logs.length);
      }),
    },

    $queryRaw: jest.fn().mockResolvedValue([1]),
  };
});

jest.unmock('bcrypt');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

process.env.JWT_SECRET = 'system-test-secret';
process.env.NODE_ENV = 'test';
process.env.PORT = '0';

const { app } = require('../../src/server');
const prisma = require('../../src/config/db');

const makeToken = (role, userId = 1, username = `${role}_user`) =>
  jwt.sign({ user_id: userId, username, role }, 'system-test-secret', { expiresIn: '1h' });

// Shared state - tests run in order (--runInBand)
let adminToken;
let createdUserId;
let createdTableId;
let createdMenuItemId;

beforeAll(async () => {
  // Give the seeded users real bcrypt hashes
  const hash = await bcrypt.hash('password123', 10);
  prisma._db.users[0].password = hash; // admin
  prisma._db.users[2].password = hash; // floor1
  prisma._db.users[3].password = hash; // kitchen1
});

describe('SCENARIO 1 - Authentication & RBAC', () => {

  test('1.1 - No token returns 401', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/No token/);
  });

  test('1.2 - Floor role returns 403 on admin endpoint', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${makeToken('floor', 3, 'floor1')}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Access denied/);
  });

  test('1.3 - Management role returns 403 on admin endpoint', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${makeToken('management', 2, 'manager1')}`);
    expect(res.status).toBe(403);
  });

  test('1.4 - Malformed JWT returns 403', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', 'Bearer this.is.not.valid');
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Invalid/);
  });

  test('1.5 - Valid admin token gains access', async () => {
    adminToken = makeToken('admin', 1, 'admin');
    const res = await request(app)
      .get('/api/admin/health')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('1.6 - Expired token returns 403', async () => {
    const expiredToken = jwt.sign(
      { user_id: 1, username: 'admin', role: 'admin' },
      'system-test-secret',
      { expiresIn: '-1s' }
    );
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(403);
  });

  test('1.7 - Wrong JWT secret returns 403', async () => {
    const wrongToken = jwt.sign(
      { user_id: 1, username: 'admin', role: 'admin' },
      'wrong-secret'
    );
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${wrongToken}`);
    expect(res.status).toBe(403);
  });
});

describe('SCENARIO 2 - Admin Dashboard & Monitoring', () => {

  test('2.1 - Dashboard returns correct shape (BUG 1 fix: systemStats / todayMetrics)', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('systemStats');
    expect(res.body).toHaveProperty('todayMetrics');
    expect(res.body).toHaveProperty('health');
    expect(res.body.systemStats).toHaveProperty('totalUsers');
    expect(res.body.systemStats).toHaveProperty('totalTables');
    expect(res.body.systemStats).toHaveProperty('totalMenuItems');
    expect(res.body.todayMetrics).toHaveProperty('revenue');
    expect(res.body.todayMetrics).toHaveProperty('orders');
    expect(res.body.todayMetrics).toHaveProperty('failedLoginAttempts');
  });

  test('2.2 - systemStats counts match seeded data', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.body.systemStats.totalUsers).toBe(4);
    expect(res.body.systemStats.totalTables).toBe(2);
    // 2 ACTIVE menu items (INACTIVE one not counted in dashboard)
    expect(res.body.systemStats.totalMenuItems).toBe(2);
  });

  test('2.3 - todayMetrics revenue is 0 when no bills', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.todayMetrics.revenue).toBe(0);
  });

  test('2.4 - Activity endpoint returns recentActivity array (BUG 1 fix)', async () => {
    const res = await request(app)
      .get('/api/admin/activity?days=7')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('recentActivity');
    expect(Array.isArray(res.body.recentActivity)).toBe(true);
    expect(res.body).toHaveProperty('loginAttempts');
    expect(res.body.loginAttempts).toHaveProperty('successful');
    expect(res.body.loginAttempts).toHaveProperty('failed');
    expect(res.body).toHaveProperty('accessDenials');
    expect(res.body).toHaveProperty('dataModifications');
  });

  test('2.5 - Activity accepts custom days query param', async () => {
    const res = await request(app)
      .get('/api/admin/activity?days=30')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.period).toMatch(/30/);
  });

  test('2.6 - System health returns valid shape', async () => {
    const res = await request(app)
      .get('/api/admin/health')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.health).toHaveProperty('status');
    expect(res.body.health).toHaveProperty('memoryUsage');
    expect(res.body.health).toHaveProperty('uptime');
    expect(['healthy', 'warning', 'critical']).toContain(res.body.health.status);
    expect(typeof res.body.health.memoryUsage).toBe('number');
    expect(res.body.health.uptime).toBeGreaterThanOrEqual(0);
  });
});

describe('SCENARIO 3 - Staff User Management', () => {

  test('3.1 - Get all users returns seeded staff', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(4);
    const usernames = res.body.users.map(u => u.username);
    expect(usernames).toContain('admin');
    expect(usernames).toContain('floor1');
  });

  test('3.2 - Passwords are never exposed in user list', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    res.body.users.forEach(user => {
      expect(user).not.toHaveProperty('password');
    });
  });

  test('3.3 - Create a new floor staff account', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'newfloor', password: 'securepass123', role: 'floor' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe('newfloor');
    expect(res.body.user.role).toBe('floor');
    expect(res.body.user).not.toHaveProperty('password');

    createdUserId = res.body.user.id;
    expect(createdUserId).toBeDefined();
  });

  test('3.4 - Created user appears in user list', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.body.users.map(u => u.username)).toContain('newfloor');
    expect(res.body.count).toBe(5);
  });

  test('3.5 - Duplicate username is rejected with 400', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'newfloor', password: 'anotherpass', role: 'kitchen' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already exists/);
  });

  test('3.6 - Invalid role is rejected with 400', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'baduser', password: 'pass123', role: 'cashier' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid role/);
  });

  test('3.7 - Missing fields returns 400', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'incomplete' });

    expect(res.status).toBe(400);
  });

  test('3.8 - All valid roles are accepted', async () => {
    const roles = ['admin', 'management', 'floor', 'kitchen'];
    for (const role of roles) {
      // find unique will return null for new username
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: `testuser_${role}`, password: 'pass123456', role });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe(role);

      // clean up immediately
      const uid = res.body.user.id;
      await request(app)
        .delete(`/api/admin/users/${uid}`)
        .set('Authorization', `Bearer ${adminToken}`);
    }
  });

  test('3.9 - Update user role from floor to kitchen', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${createdUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'kitchen' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('kitchen');
    expect(res.body.user.username).toBe('newfloor');
  });

  test('3.10 - Role update to invalid role is rejected', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${createdUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'god' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid role/);
  });

  test('3.11 - Role update with empty body is rejected', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${createdUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  test('3.12 - Reset user password successfully', async () => {
    const res = await request(app)
      .post(`/api/admin/users/${createdUserId}/reset-password`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ newPassword: 'brandnewpass456' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify the new hash was actually stored in DB
    const stored = prisma._db.users.find(u => u.id === createdUserId);
    const isMatch = await bcrypt.compare('brandnewpass456', stored.password);
    expect(isMatch).toBe(true);
  });

  test('3.13 - Password reset rejects short password (<6 chars)', async () => {
    const res = await request(app)
      .post(`/api/admin/users/${createdUserId}/reset-password`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ newPassword: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/6 characters/);
  });

  test('3.14 - Password reset with missing body is rejected', async () => {
    const res = await request(app)
      .post(`/api/admin/users/${createdUserId}/reset-password`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  test('3.15 - Admin cannot delete their own account', async () => {
    const res = await request(app)
      .delete('/api/admin/users/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Cannot delete your own account/);
  });

  test('3.16 - Delete non-existent user returns 400', async () => {
    const res = await request(app)
      .delete('/api/admin/users/9999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not found/i);
  });

  test('3.17 - Delete created staff user successfully', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('3.18 - Deleted user no longer appears in user list', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.body.users.map(u => u.username)).not.toContain('newfloor');
    expect(res.body.count).toBe(4);
  });
});

describe('SCENARIO 4 - Table Layout Management', () => {

  test('4.1 - Get all tables returns seeded tables', async () => {
    const res = await request(app)
      .get('/api/admin/tables')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const labels = res.body.tables.map(t => t.label);
    expect(labels).toContain('T1');
    expect(labels).toContain('T2');
  });

  test('4.2 - Create a new table', async () => {
    const res = await request(app)
      .post('/api/admin/tables')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ label: 'T9', capacity: 6 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.table.label).toBe('T9');
    expect(res.body.table.capacity).toBe(6);

    createdTableId = res.body.table.id;
    expect(createdTableId).toBeDefined();
  });

  test('4.3 - Duplicate table label is rejected', async () => {
    const res = await request(app)
      .post('/api/admin/tables')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ label: 'T9', capacity: 4 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/);
  });

  test('4.4 - New table appears in table list', async () => {
    const res = await request(app)
      .get('/api/admin/tables')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.body.tables.map(t => t.label)).toContain('T9');
  });

  test('4.5 - Update table capacity', async () => {
    const res = await request(app)
      .put(`/api/admin/tables/${createdTableId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ capacity: 8 });

    expect(res.status).toBe(200);
    expect(res.body.table.capacity).toBe(8);
  });

  test('4.6 - Update table status', async () => {
    const res = await request(app)
      .put(`/api/admin/tables/${createdTableId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CLEANING' });

    expect(res.status).toBe(200);
    expect(res.body.table).toBeDefined();
  });

  test('4.7 - Update non-existent table returns 404', async () => {
    const res = await request(app)
      .put('/api/admin/tables/9999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ capacity: 4 });

    expect(res.status).toBe(404);
  });

  test('4.8 - Soft delete (deactivate) the created table', async () => {
    const res = await request(app)
      .delete(`/api/admin/tables/${createdTableId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('4.9 - Deactivated table has isActive=false in DB', async () => {
    const inDb = prisma._db.tables.find(t => t.id === createdTableId);
    expect(inDb.isActive).toBe(false);
  });
});

describe('SCENARIO 5 - Menu Management', () => {

  test('5.1 - Admin GET /admin/menu sees ALL items including INACTIVE (BUG 4 fix)', async () => {
    const res = await request(app)
      .get('/api/admin/menu')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const statuses = res.body.menuItems.map(m => m.status);
    expect(statuses).toContain('ACTIVE');
    expect(statuses).toContain('INACTIVE');
  });

  test('5.2 - Create a new menu item', async () => {
    const res = await request(app)
      .post('/api/admin/menu')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Soufflé', description: 'Light and airy', price: 7.5, category: 'DESSERT', status: 'ACTIVE' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.menuItem.name).toBe('Test Soufflé');
    expect(parseFloat(res.body.menuItem.price)).toBe(7.5);

    createdMenuItemId = res.body.menuItem.id;
    expect(createdMenuItemId).toBeDefined();
  });

  test('5.3 - Missing required fields are rejected', async () => {
    const res = await request(app)
      .post('/api/admin/menu')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Incomplete Item' }); // missing price and category

    expect(res.status).toBe(400);
  });

  test('5.4 - Update menu item price', async () => {
    const res = await request(app)
      .put(`/api/admin/menu/${createdMenuItemId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 8.0 });

    expect(res.status).toBe(200);
    expect(parseFloat(res.body.menuItem.price)).toBe(8.0);
  });

  test('5.5 - Update menu item name', async () => {
    const res = await request(app)
      .put(`/api/admin/menu/${createdMenuItemId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Soufflé' });

    expect(res.status).toBe(200);
    expect(res.body.menuItem.name).toBe('Updated Soufflé');
  });

  test('5.6 - Mark menu item as SOLD_OUT', async () => {
    const res = await request(app)
      .put(`/api/admin/menu/${createdMenuItemId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SOLD_OUT' });

    expect(res.status).toBe(200);
    expect(res.body.menuItem.status).toBe('SOLD_OUT');
  });

  test('5.7 - Soft delete menu item sets status to INACTIVE (not hard delete)', async () => {
    const res = await request(app)
      .delete(`/api/admin/menu/${createdMenuItemId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const inDb = prisma._db.menuItems.find(m => m.id === createdMenuItemId);
    expect(inDb).toBeDefined();          // record still exists
    expect(inDb.status).toBe('INACTIVE'); // but marked inactive
  });

  test('5.8 - Deactivated item still visible to admin', async () => {
    const res = await request(app)
      .get('/api/admin/menu')
      .set('Authorization', `Bearer ${adminToken}`);

    const item = res.body.menuItems.find(m => m.id === createdMenuItemId);
    expect(item).toBeDefined();
    expect(item.status).toBe('INACTIVE');
  });

  test('5.9 - Update non-existent menu item returns 404', async () => {
    const res = await request(app)
      .put('/api/admin/menu/9999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 1.0 });

    expect(res.status).toBe(404);
  });
});

describe('SCENARIO 6 - Audit Trail Integrity', () => {

  beforeEach(() => {
    prisma._db.auditLogs.length = 0; // clear logs before each test in this block
  });

  test('6.1 - Admin dashboard view is recorded in audit log', async () => {
    await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    const entry = prisma._db.auditLogs.find(l => l.action === 'ADMIN_VIEW_DASHBOARD');
    expect(entry).toBeDefined();
    expect(entry.success).toBe(true);
    expect(entry.userId).toBe(1); // admin's ID
  });

  test('6.2 - User list view is recorded in audit log', async () => {
    await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(prisma._db.auditLogs.find(l => l.action === 'ADMIN_VIEW_USERS')).toBeDefined();
  });

  test('6.3 - User creation is recorded in audit log', async () => {
    await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'audituser', password: 'pass1234', role: 'floor' });

    const entry = prisma._db.auditLogs.find(l => l.action === 'USER_CREATED');
    expect(entry).toBeDefined();
    expect(entry.success).toBe(true);

    // cleanup
    const u = prisma._db.users.find(u => u.username === 'audituser');
    if (u) prisma._db.users.splice(prisma._db.users.indexOf(u), 1);
  });

  test('6.4 - Failed user creation (invalid role) records USER_CREATE_FAILED', async () => {
    await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'baduser2', password: 'pass1234', role: 'invalidrole' });

    const entry = prisma._db.auditLogs.find(l => l.action === 'USER_CREATE_FAILED');
    expect(entry).toBeDefined();
    expect(entry.success).toBe(false);
  });

  test('6.5 - Access denial is recorded when floor staff hits admin endpoint', async () => {
    await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${makeToken('floor', 3, 'floor1')}`);

    const entry = prisma._db.auditLogs.find(l => l.action === 'ACCESS_DENIED');
    expect(entry).toBeDefined();
    expect(entry.success).toBe(false);
    expect(entry.userId).toBe(3); // floor1's ID
  });

  test('6.6 - Role update is recorded in audit log', async () => {
    // Create a temp user to update
    prisma._db.users.push({ id: 99, username: 'tempuser', password: 'x', role: 'floor', createdAt: new Date() });

    await request(app)
      .put('/api/admin/users/99/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'kitchen' });

    const entry = prisma._db.auditLogs.find(l => l.action === 'USER_ROLE_UPDATED');
    expect(entry).toBeDefined();
    expect(entry.success).toBe(true);

    // cleanup
    prisma._db.users.splice(prisma._db.users.findIndex(u => u.id === 99), 1);
  });

  test('6.7 - Password reset is recorded in audit log', async () => {
    prisma._db.users.push({ id: 98, username: 'resetuser', password: 'x', role: 'floor', createdAt: new Date() });

    await request(app)
      .post('/api/admin/users/98/reset-password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ newPassword: 'newpassword123' });

    const entry = prisma._db.auditLogs.find(l => l.action === 'PASSWORD_RESET');
    expect(entry).toBeDefined();
    expect(entry.success).toBe(true);

    // cleanup
    prisma._db.users.splice(prisma._db.users.findIndex(u => u.id === 98), 1);
  });

  test('6.8 - User deletion is recorded in audit log', async () => {
    prisma._db.users.push({ id: 97, username: 'deleteuser', password: 'x', role: 'floor', createdAt: new Date() });

    await request(app)
      .delete('/api/admin/users/97')
      .set('Authorization', `Bearer ${adminToken}`);

    const entry = prisma._db.auditLogs.find(l => l.action === 'USER_DELETED');
    expect(entry).toBeDefined();
    expect(entry.success).toBe(true);
  });
});

describe('SCENARIO 7 - Bug Regression', () => {

  test('7.1 - BUG 1: dashboard uses "systemStats" key (not "system")', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.body).toHaveProperty('systemStats');
    expect(res.body).not.toHaveProperty('system');
  });

  test('7.2 - BUG 1: dashboard uses "todayMetrics" key (not "daily")', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.body).toHaveProperty('todayMetrics');
    expect(res.body).not.toHaveProperty('daily');
  });

  test('7.3 - BUG 1: activity response includes "recentActivity" array', async () => {
    const res = await request(app)
      .get('/api/admin/activity')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.body).toHaveProperty('recentActivity');
    expect(Array.isArray(res.body.recentActivity)).toBe(true);
  });

  test('7.4 - BUG 4: admin menu shows INACTIVE items (regular /menu hides them)', async () => {
    // Admin sees all
    const adminRes = await request(app)
      .get('/api/admin/menu')
      .set('Authorization', `Bearer ${adminToken}`);

    const adminStatuses = adminRes.body.menuItems.map(m => m.status);
    expect(adminStatuses).toContain('INACTIVE');
  });

  test('7.5 - BUG 5: unauthorized access returns 403 not a 500 crash', async () => {
    const res = await request(app)
      .delete('/api/admin/users/2')
      .set('Authorization', `Bearer ${makeToken('floor', 3, 'floor1')}`);

    expect(res.status).toBe(403);
    expect(res.status).not.toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  test('7.6 - Responses never expose password hashes', async () => {
    const usersRes = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    usersRes.body.users.forEach(user => {
      expect(user).not.toHaveProperty('password');
    });

    const createRes = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'pwdtest', password: 'pass123456', role: 'floor' });

    expect(createRes.body.user).not.toHaveProperty('password');

    // cleanup
    const u = prisma._db.users.find(u => u.username === 'pwdtest');
    if (u) prisma._db.users.splice(prisma._db.users.indexOf(u), 1);
  });

  test('7.7 - Self-delete protection works at HTTP layer (not just service layer)', async () => {
    const res = await request(app)
      .delete('/api/admin/users/1') // admin's own ID
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Cannot delete your own account/);

    // Admin user must still exist
    expect(prisma._db.users.find(u => u.id === 1)).toBeDefined();
  });
});
