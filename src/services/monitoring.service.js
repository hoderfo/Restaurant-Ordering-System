const prisma = require('../config/db');

class MonitoringService {
  constructor() {
    this.startTime = Date.now();
    this.healthChecks = {
      database: { status: 'unknown', lastCheck: null, responseTime: 0 },
      memory: { status: 'unknown', lastCheck: null, usage: 0 }
    };
  }

  // Run health checks
  async runHealthChecks() {
    try {
      await this.checkDatabase();
      this.checkMemory();
    } catch (error) {
      console.error('Health check error:', error);
    }
  }

  // Check database connectivity
  async checkDatabase() {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;

      this.healthChecks.database = {
        status: responseTime > 5000 ? 'degraded' : 'healthy',
        lastCheck: new Date(),
        responseTime
      };
    } catch (error) {
      this.healthChecks.database = {
        status: 'unhealthy',
        lastCheck: new Date(),
        error: error.message,
        responseTime: Date.now() - start
      };
    }
  }

  // Check memory usage
  checkMemory() {
    const usage = process.memoryUsage();
    const heapUsed = (usage.heapUsed / usage.heapTotal) * 100;

    this.healthChecks.memory = {
      status: heapUsed > 90 ? 'critical' : heapUsed > 80 ? 'warning' : 'healthy',
      lastCheck: new Date(),
      usage: heapUsed.toFixed(2),
      total: (usage.heapTotal / 1024 / 1024).toFixed(2),
      used: (usage.heapUsed / 1024 / 1024).toFixed(2)
    };
  }

  // Get overall system health
  getHealth() {
    const statuses = Object.values(this.healthChecks).map(h => h.status);
    const hasUnhealthy = statuses.includes('unhealthy');
    const hasDegraded = statuses.includes('degraded');

    return {
      status: hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date(),
      services: this.healthChecks
    };
  }

  // Get detailed metrics
  getMetrics() {
    const memory = process.memoryUsage();

    return {
      timestamp: new Date(),
      memory: {
        heapUsed: (memory.heapUsed / 1024 / 1024).toFixed(2),
        heapTotal: (memory.heapTotal / 1024 / 1024).toFixed(2),
        external: (memory.external / 1024 / 1024).toFixed(2),
        rss: (memory.rss / 1024 / 1024).toFixed(2)
      },
      uptime: process.uptime(),
      cpu: process.cpuUsage()
    };
  }

  // Get full diagnostics
  async getDiagnostics() {
    return {
      health: this.getHealth(),
      metrics: this.getMetrics(),
      services: this.healthChecks,
      version: process.version,
      environment: process.env.NODE_ENV
    };
  }
}

module.exports = new MonitoringService();
