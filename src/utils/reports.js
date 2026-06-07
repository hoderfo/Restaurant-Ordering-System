const pool = require('../config/db');
const PDFDocument = require('pdfkit');

async function generateDailyReport(date) {
  try {
    // Revenue breakdown by category
    const categoryRevenue = await pool.query(`
      SELECT m.category, COUNT(DISTINCT oi.order_id) as orders, SUM(oi.quantity) as items_sold, SUM(oi.quantity * oi.unit_price) as revenue
      FROM order_items oi
      JOIN menu_items m ON oi.menu_item_id = m.menu_item_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE DATE(o.created_at) = $1
      GROUP BY m.category
      ORDER BY revenue DESC
    `, [date]);

    // Total metrics
    const totalMetrics = await pool.query(`
      SELECT COUNT(DISTINCT b.order_id) as total_orders, COALESCE(SUM(b.total), 0) as total_revenue, COALESCE(SUM(b.tax_amount), 0) as total_tax, COALESCE(SUM(b.discount_amount), 0) as total_discounts, AVG(b.total) as avg_order_value
      FROM bills b
      WHERE DATE(b.closed_at) = $1 AND b.closed_at IS NOT NULL
    `, [date]);

    // Top items
    const topItems = await pool.query(`
      SELECT m.name, m.category, COUNT(DISTINCT oi.order_id) as order_frequency, SUM(oi.quantity) as quantity, SUM(oi.quantity * oi.unit_price) as revenue
      FROM order_items oi
      JOIN menu_items m ON oi.menu_item_id = m.menu_item_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE DATE(o.created_at) = $1
      GROUP BY m.menu_item_id, m.name, m.category
      ORDER BY order_frequency DESC
      LIMIT 10
    `, [date]);

    const metrics = totalMetrics.rows[0];

    return {
      date,
      summary: {
        total_orders: parseInt(metrics.total_orders),
        total_revenue: parseFloat(metrics.total_revenue),
        total_tax: parseFloat(metrics.total_tax),
        total_discounts: parseFloat(metrics.total_discounts),
        avg_order_value: metrics.avg_order_value ? parseFloat(metrics.avg_order_value) : 0
      },
      by_category: categoryRevenue.rows.map(row => ({
        category: row.category,
        orders: parseInt(row.orders),
        items_sold: parseInt(row.items_sold),
        revenue: parseFloat(row.revenue)
      })),
      top_items: topItems.rows.map(row => ({
        name: row.name,
        category: row.category,
        order_frequency: parseInt(row.order_frequency),
        quantity: parseInt(row.quantity),
        revenue: parseFloat(row.revenue)
      }))
    };

  } catch (error) {
    console.error('Error generating daily report:', error);
    throw error;
  }
}

async function generateWeeklyReport(startDate) {
  try {
    const endDate = new Date().toISOString().split('T')[0];

    // Daily breakdown
    const dailyBreakdown = await pool.query(`
      SELECT DATE(b.closed_at) as day, COUNT(DISTINCT b.order_id) as orders, COALESCE(SUM(b.total), 0) as revenue
      FROM bills b
      WHERE DATE(b.closed_at) BETWEEN $1 AND $2 AND b.closed_at IS NOT NULL
      GROUP BY DATE(b.closed_at)
      ORDER BY day ASC
    `, [startDate, endDate]);

    // Weekly totals
    const weeklyTotals = await pool.query(`
      SELECT COUNT(DISTINCT b.order_id) as total_orders, COALESCE(SUM(b.total), 0) as total_revenue, COALESCE(SUM(b.tax_amount), 0) as total_tax, COALESCE(SUM(b.discount_amount), 0) as total_discounts, AVG(b.total) as avg_order_value
      FROM bills b
      WHERE DATE(b.closed_at) BETWEEN $1 AND $2 AND b.closed_at IS NOT NULL
    `, [startDate, endDate]);

    // Top items for the week
    const topItems = await pool.query(`
      SELECT m.name, m.category, COUNT(DISTINCT oi.order_id) as order_frequency, SUM(oi.quantity) as quantity, SUM(oi.quantity * oi.unit_price) as revenue
      FROM order_items oi
      JOIN menu_items m ON oi.menu_item_id = m.menu_item_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE DATE(o.created_at) BETWEEN $1 AND $2
      GROUP BY m.menu_item_id, m.name, m.category
      ORDER BY order_frequency DESC
      LIMIT 10
    `, [startDate, endDate]);

    const metrics = weeklyTotals.rows[0];

    return {
      period: `${startDate} to ${endDate}`,
      summary: {
        total_orders: parseInt(metrics.total_orders),
        total_revenue: parseFloat(metrics.total_revenue),
        total_tax: parseFloat(metrics.total_tax),
        total_discounts: parseFloat(metrics.total_discounts),
        avg_order_value: metrics.avg_order_value ? parseFloat(metrics.avg_order_value) : 0
      },
      daily_breakdown: dailyBreakdown.rows.map(row => ({
        day: row.day,
        orders: parseInt(row.orders),
        revenue: parseFloat(row.revenue)
      })),
      top_items: topItems.rows.map(row => ({
        name: row.name,
        category: row.category,
        order_frequency: parseInt(row.order_frequency),
        quantity: parseInt(row.quantity),
        revenue: parseFloat(row.revenue)
      }))
    };

  } catch (error) {
    console.error('Error generating weekly report:', error);
    throw error;
  }
}

function generatePDF(reportData, type, date) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40
  });

  // Header
  doc.fontSize(20).font('Helvetica-Bold').text('Restaurant Report', { align: 'center' });
  doc.fontSize(12).font('Helvetica').text(`Type: ${type.toUpperCase()}`, { align: 'center' });
  doc.fontSize(11).text(type === 'daily' 
    ? `Date: ${date}` 
    : `Period: ${reportData.period}`, 
    { align: 'center' }
  );
  doc.moveDown();

  // Summary Section
  doc.fontSize(14).font('Helvetica-Bold').text('Summary');
  doc.fontSize(11).font('Helvetica');
  doc.text(`Total Orders: ${reportData.summary.total_orders}`);
  doc.text(`Total Revenue: $${reportData.summary.total_revenue.toFixed(2)}`);
  doc.text(`Average Order Value: $${reportData.summary.avg_order_value.toFixed(2)}`);
  doc.text(`Tax: $${reportData.summary.total_tax.toFixed(2)}`);
  doc.text(`Discounts: $${reportData.summary.total_discounts.toFixed(2)}`);
  doc.moveDown();

  // Daily breakdown for weekly reports
  if (type === 'weekly' && reportData.daily_breakdown) {
    doc.fontSize(14).font('Helvetica-Bold').text('Daily Breakdown');
    doc.fontSize(10).font('Helvetica');
    
    reportData.daily_breakdown.forEach(day => {
      doc.text(`${day.day}: ${day.orders} orders | $${day.revenue.toFixed(2)}`, { indent: 20 });
    });
    doc.moveDown();
  }

  // Top Items
  doc.fontSize(14).font('Helvetica-Bold').text('Top Items');
  doc.fontSize(10).font('Helvetica');
  
  reportData.top_items.slice(0, 10).forEach((item, idx) => {
    doc.text(
      `${idx + 1}. ${item.name} (${item.category}) - ${item.order_frequency} orders | $${item.revenue.toFixed(2)}`,
      { indent: 20 }
    );
  });
  doc.moveDown();

  // Footer
  doc.fontSize(9).font('Helvetica').text(
    `Generated: ${new Date().toISOString()}`,
    { align: 'center', color: '#999999' }
  );

  return doc;
}

module.exports = {
  generateDailyReport,
  generateWeeklyReport,
  generatePDF
};
