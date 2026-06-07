const pool = require('../config/db');
const { logAudit } = require('../utils/audit');

async function getDashboard(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [
      revenueResult,
      orderCountResult,
      topItemsResult,
      activeOrdersResult
    ] = await Promise.all([
      pool.query(`
        SELECT COALESCE(SUM(total), 0) as total_revenue
        FROM bills
        WHERE DATE(closed_at) = $1 AND closed_at IS NOT NULL
      `, [today]),

      pool.query(`
        SELECT COUNT(DISTINCT order_id) as order_count
        FROM orders
        WHERE DATE(created_at) = $1
      `, [today]),

      pool.query(`
        SELECT m.menu_item_id, m.name, COUNT(DISTINCT oi.order_id) as order_frequency, SUM(oi.quantity) as total_quantity, m.category
        FROM menu_items m
        LEFT JOIN order_items oi ON m.menu_item_id = oi.menu_item_id
        LEFT JOIN orders o ON oi.order_id = o.order_id
        WHERE DATE(o.created_at) = $1 OR o.created_at IS NULL
        GROUP BY m.menu_item_id, m.name, m.category
        ORDER BY order_frequency DESC
        LIMIT 5
      `, [today]),

      pool.query(`
        SELECT COUNT(*) as active_count
        FROM orders
        WHERE status = 'active' AND DATE(created_at) = $1
      `, [today])
    ]);

    const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue);
    const orderCount = parseInt(orderCountResult.rows[0].order_count);
    const avgOrderValue = orderCount > 0 ? (totalRevenue / orderCount).toFixed(2) : 0;

    await logAudit(
      req.user.user_id,
      'view_dashboard',
      'analytics',
      true,
      req.ip,
      { date: today }
    );

    res.json({
      date: today,
      metrics: {
        total_revenue: totalRevenue,
        order_count: orderCount,
        avg_order_value: parseFloat(avgOrderValue),
        active_orders: parseInt(activeOrdersResult.rows[0].active_count)
      },
      top_items: topItemsResult.rows.map(item => ({
        menu_item_id: item.menu_item_id,
        name: item.name,
        category: item.category,
        order_frequency: parseInt(item.order_frequency),
        total_quantity: parseInt(item.total_quantity)
      }))
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data.' });
  }
}

async function getAuditLog(req, res) {
  try {
    const { action, limit = 100, days = 7 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let query = `
      SELECT al.log_id, al.user_id, u.username, al.action, al.resource, al.success, al.ip_address, al.timestamp, al.details
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.user_id
      WHERE al.timestamp >= $1
    `;
    const params = [startDate];

    if (action) {
      query += ` AND al.action = $${params.length + 1}`;
      params.push(action);
    }

    query += ` ORDER BY al.timestamp DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    await logAudit(
      req.user.user_id,
      'view_audit_log',
      'analytics',
      true,
      req.ip,
      { action, limit, days }
    );

    res.json({
      count: result.rows.length,
      logs: result.rows.map(log => ({
        log_id: log.log_id,
        user_id: log.user_id,
        username: log.username,
        action: log.action,
        resource: log.resource,
        success: log.success,
        ip_address: log.ip_address,
        timestamp: log.timestamp,
        details: log.details
      }))
    });

  } catch (error) {
    console.error('Audit log error:', error);
    res.status(500).json({ error: 'Failed to fetch audit log.' });
  }
}

async function getDailyReport(req, res) {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    const { generateDailyReport } = require('../utils/reports');

    const reportData = await generateDailyReport(date);

    await logAudit(
      req.user.user_id,
      'generate_daily_report',
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

async function getWeeklyReport(req, res) {
  try {
    const today = new Date();
    const defaultStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { start_date = defaultStart } = req.query;
    const { generateWeeklyReport } = require('../utils/reports');

    const reportData = await generateWeeklyReport(start_date);

    await logAudit(
      req.user.user_id,
      'generate_weekly_report',
      `report_weekly_from_${start_date}`,
      true,
      req.ip,
      { start_date }
    );

    res.json({
      report_type: 'weekly',
      start_date,
      end_date: new Date().toISOString().split('T')[0],
      generated_at: new Date().toISOString(),
      data: reportData
    });

  } catch (error) {
    console.error('Weekly report error:', error);
    res.status(500).json({ error: 'Failed to generate weekly report.' });
  }
}

async function exportPDF(req, res) {
  try {
    const { type = 'daily', date = new Date().toISOString().split('T')[0] } = req.query;
    const { generateDailyReport, generateWeeklyReport, generatePDF } = require('../utils/reports');

    let reportData;
    if (type === 'weekly') {
      reportData = await generateWeeklyReport(date);
    } else {
      reportData = await generateDailyReport(date);
    }

    const pdfStream = generatePDF(reportData, type, date);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report_${type}_${date}.pdf"`);

    await logAudit(
      req.user.user_id,
      'export_report_pdf',
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
