const express = require('express');
const cors = require('cors');
const compression = require('compression');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
require('dotenv').config();

// Routes
const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics_router');

// Middleware
const { authenticateToken } = require('./middleware/auth');
const { requireRole, ROLES } = require('./middleware/rbac');
const { apiLimiter, loginLimiter, analyticsLimiter } = require('./middleware/rateLimit');

// WebSocket & Services
const { setupWebSocketHandlers } = require('./websocket/handlers');
const backupService = require('./services/backup.service');
const monitoringService = require('./services/monitoring.service');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingInterval: 25000,
  pingTimeout: 20000
});

const PORT = process.env.PORT || 3000;

// Security + Performance
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.set('trust proxy', true);

// Rate Limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/analytics', analyticsLimiter);
app.use('/api/reports', analyticsLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/reports', authenticateToken, analyticsRoutes);

// WebSocket
setupWebSocketHandlers(io);
app.locals.io = io;

// Health Checks
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/health/detailed', authenticateToken, requireRole(ROLES.ADMIN), (req, res) => {
  const health = monitoringService.getHealth();
  res.json(health);
});

app.get('/api/health/diagnostics', authenticateToken, requireRole(ROLES.ADMIN), async (req, res) => {
  const diagnostics = await monitoringService.getDiagnostics();
  res.json(diagnostics);
});

// Backup
app.post('/api/backup/now', authenticateToken, requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const result = await backupService.createBackup();
    res.json({ success: true, backup: result });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Backup failed' });
  }
});

app.get('/api/backup/history', authenticateToken, requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const history = await backupService.getBackupHistory(10);
    res.json({ backups: history });
  } catch (error) {
    console.error('Backup history error:', error);
    res.status(500).json({ error: 'Failed to fetch backup history' });
  }
});

// 404 NOT FOUND :<
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);

  if (error.status === 429) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  if (error.status === 400) {
    return res.status(400).json({ error: error.message });
  }

  res.status(500).json({ error: 'Internal server error' });
});

// Shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  
  server.close(() => {
    console.log('HTTP server closed :>');
  });

  io.close();
  console.log('WebSocket closed :>');

  process.exit(0);
});

// Periodic Tasks
const scheduleDailyBackup = () => {
  const now = new Date();
  const target = new Date();
  target.setHours(2, 0, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const ms = target.getTime() - now.getTime();
  console.log(`Daily backup scheduled in ${Math.floor(ms / 1000 / 60)} minutes`);

  setTimeout(() => {
    backupService.runDailyBackups();
    setInterval(() => backupService.runDailyBackups(), 24 * 60 * 60 * 1000);
  }, ms);
};

server.listen(PORT, () => {
  console.log(`
	HTTP Server: http://localhost:${PORT}
	Environment: ${process.env.NODE_ENV}
  `);

  scheduleDailyBackup();
  monitoringService.runHealthChecks();
});

module.exports = { app, server, io };
