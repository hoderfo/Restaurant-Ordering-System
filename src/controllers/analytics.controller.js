const analyticsService = require('../services/analytics.service');
const reportsService = require('../services/reports.service');
const auditService = require('../services/audit.service');

// Get real-time dashboard
async function getDashboard(req, res) {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    const dashboardData = await analyticsService.getDashboardMetrics(date);

    await auditService.logAction(
      req.user.user_id,
      'VIEW_DASHBOARD',
      'analytics',
      true,
      req.ip,
      { date }
    );

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data.' });
  }
}

// Get audit log
async function getAuditLog(req, res) {
  try {
    const { action = null, limit = 100, days = 7 } = req.query;

    const logs = await auditService.getRecentLogs(parseInt(limit));

    await auditService.logAction(
      req.user.user_id,
      'VIEW_AUDIT_LOG',
      'analytics',
      true,
      req.ip,
      { action, limit, days }
    );

    res.json({
      count: logs.length,
      logs: logs.map(log => ({
        log_id: log.id,
        user_id: log.userId,
        username: log.user?.username,
        action: log.action,
        resource: log.resource,
        success: log.success,
        ip_address: log.ipAddress,
        timestamp: log.timestamp,
        details: log.details
      }))
    });
  } catch (error) {
    console.error('Audit log error:', error);
    res.status(500).json({ error: 'Failed to fetch audit log.' });
  }
}

// Get daily report
async function getDailyReport(req, res) {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    const reportData = await reportsService.generateDailyReport(date);

    await auditService.logAction(
      req.user.user_id,
      'GENERATE_DAILY_REPORT',
      `report_daily_${date}`,
      true,
      req.ip,
      { date }
    );

    res.json({
      report_type: 'daily',
      date,
      generated_at: new Date().toISOString(),
      data: reportData
    });
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({ error: 'Failed to generate daily report.' });
  }
}

// Get weekly report
async function getWeeklyReport(req, res) {
  try {
    const today = new Date();
    const defaultStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const { start_date = defaultStart } = req.query;

    const reportData = await reportsService.generateWeeklyReport(start_date);

    await auditService.logAction(
      req.user.user_id,
      'GENERATE_WEEKLY_REPORT',
      `report_weekly_from_${start_date}`,
      true,
      req.ip,
      { start_date }
    );

    res.json({
      report_type: 'weekly',
      start_date,
      end_date: today.toISOString().split('T')[0],
      generated_at: new Date().toISOString(),
      data: reportData
    });
  } catch (error) {
    console.error('Weekly report error:', error);
    res.status(500).json({ error: 'Failed to generate weekly report.' });
  }
}

// Export report as PDF
async function exportPDF(req, res) {
  try {
    const { type = 'daily', date = new Date().toISOString().split('T')[0] } = req.query;

    let reportData;
    if (type === 'weekly') {
      reportData = await reportsService.generateWeeklyReport(date);
    } else {
      reportData = await reportsService.generateDailyReport(date);
    }

    const pdfStream = reportsService.generatePDF(reportData, type, date);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report_${type}_${date}.pdf"`);

    await auditService.logAction(
      req.user.user_id,
      'EXPORT_REPORT_PDF',
      `report_${type}_${date}`,
      true,
      req.ip,
      { type, date }
    );

    pdfStream.pipe(res);
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Failed to export PDF report.' });
  }
}

module.exports = {
  getDashboard,
  getAuditLog,
  getDailyReport,
  getWeeklyReport,
  exportPDF
};
