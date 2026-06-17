const prisma = require('../config/db');
const PDFDocument = require('pdfkit');

class ReportsService {
  // Generate daily report data
  async generateDailyReport(dateString) {
    const date = new Date(dateString);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Total metrics
    const totalRevenue = await prisma.bill.aggregate({
      where: {
        closedAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      _sum: {
        total: true,
        taxAmount: true,
        discountAmount: true
      }
    });

    const orderCount = await prisma.bill.count({
      where: {
        closedAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Category breakdown
    const categoryBreakdown = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        order: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      },
      _count: { orderId: true },
      _sum: { quantity: true, unitPrice: true }
    });

    const categoryMap = {};
    await Promise.all(
      categoryBreakdown.map(async (item) => {
        const menu = await prisma.menuItem.findUnique({
          where: { id: item.menuItemId },
          select: { category: true }
        });
        
        const cat = menu.category;
        if (!categoryMap[cat]) {
          categoryMap[cat] = { category: cat, orders: 0, items_sold: 0, revenue: 0 };
        }
        categoryMap[cat].orders += item._count.orderId;
        categoryMap[cat].items_sold += item._sum.quantity || 0;
        categoryMap[cat].revenue += parseFloat((item._sum.unitPrice || 0).toString());
      })
    );

    // Top items
    const topItemsRaw = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        order: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      },
      _count: { orderId: true },
      _sum: { quantity: true, unitPrice: true },
      orderBy: { _count: { orderId: 'desc' } },
      take: 10
    });

    const topItems = await Promise.all(
      topItemsRaw.map(async (item) => {
        const menu = await prisma.menuItem.findUnique({
          where: { id: item.menuItemId }
        });
        return {
          name: menu.name,
          category: menu.category,
          order_frequency: item._count.orderId,
          quantity: item._sum.quantity || 0,
          revenue: parseFloat((item._sum.unitPrice || 0).toString())
        };
      })
    );

    return {
      date: dateString,
      summary: {
        total_orders: orderCount,
        total_revenue: parseFloat((totalRevenue._sum.total || 0).toString()),
        total_tax: parseFloat((totalRevenue._sum.taxAmount || 0).toString()),
        total_discounts: parseFloat((totalRevenue._sum.discountAmount || 0).toString()),
        avg_order_value: orderCount > 0 
          ? parseFloat(((totalRevenue._sum.total || 0) / orderCount).toFixed(2))
          : 0
      },
      by_category: Object.values(categoryMap),
      top_items: topItems
    };
  }

  // Generate weekly report data
  async generateWeeklyReport(startDateString) {
    const startDate = new Date(startDateString);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    // Daily breakdown
    const dailyBreakdown = await prisma.bill.groupBy({
      by: ['closedAt'],
      where: {
        closedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: { id: true },
      _sum: { total: true }
    });

    const dailyData = dailyBreakdown.map(day => ({
      day: day.closedAt.toISOString().split('T')[0],
      orders: day._count.id,
      revenue: parseFloat((day._sum.total || 0).toString())
    }));

    // Weekly totals
    const weeklyTotals = await prisma.bill.aggregate({
      where: {
        closedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: { id: true },
      _sum: { total: true, taxAmount: true, discountAmount: true }
    });

    // Top items
    const topItemsRaw = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        order: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      },
      _count: { orderId: true },
      _sum: { quantity: true, unitPrice: true },
      orderBy: { _count: { orderId: 'desc' } },
      take: 10
    });

    const topItems = await Promise.all(
      topItemsRaw.map(async (item) => {
        const menu = await prisma.menuItem.findUnique({
          where: { id: item.menuItemId }
        });
        return {
          name: menu.name,
          category: menu.category,
          order_frequency: item._count.orderId,
          quantity: item._sum.quantity || 0,
          revenue: parseFloat((item._sum.unitPrice || 0).toString())
        };
      })
    );

    return {
      period: `${startDateString} to ${endDate.toISOString().split('T')[0]}`,
      summary: {
        total_orders: weeklyTotals._count.id,
        total_revenue: parseFloat((weeklyTotals._sum.total || 0).toString()),
        total_tax: parseFloat((weeklyTotals._sum.taxAmount || 0).toString()),
        total_discounts: parseFloat((weeklyTotals._sum.discountAmount || 0).toString()),
        avg_order_value: weeklyTotals._count.id > 0
          ? parseFloat(((weeklyTotals._sum.total || 0) / weeklyTotals._count.id).toFixed(2))
          : 0
      },
      daily_breakdown: dailyData,
      top_items: topItems
    };
  }

  // Generate PDF document from report data
  generatePDF(reportData, type, date) {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Restaurant Report', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text(`Type: ${type.toUpperCase()}`, { align: 'center' });
    doc.fontSize(11).text(
      type === 'daily' ? `Date: ${date}` : `Period: ${reportData.period}`,
      { align: 'center' }
    );
    doc.moveDown();

    // Summary
    doc.fontSize(14).font('Helvetica-Bold').text('Summary');
    doc.fontSize(11).font('Helvetica');
    doc.text(`Total Orders: ${reportData.summary.total_orders}`);
    doc.text(`Total Revenue: $${reportData.summary.total_revenue.toFixed(2)}`);
    doc.text(`Average Order Value: $${reportData.summary.avg_order_value.toFixed(2)}`);
    doc.text(`Tax: $${reportData.summary.total_tax.toFixed(2)}`);
    doc.text(`Discounts: $${reportData.summary.total_discounts.toFixed(2)}`);
    doc.moveDown();

    // Daily breakdown for weekly
    if (type === 'weekly' && reportData.daily_breakdown) {
      doc.fontSize(14).font('Helvetica-Bold').text('Daily Breakdown');
      doc.fontSize(10).font('Helvetica');
      reportData.daily_breakdown.forEach(day => {
        doc.text(`${day.day}: ${day.orders} orders | $${day.revenue.toFixed(2)}`, { indent: 20 });
      });
      doc.moveDown();
    }

    // Top items
    doc.fontSize(14).font('Helvetica-Bold').text('Top Items');
    doc.fontSize(10).font('Helvetica');
    reportData.top_items.slice(0, 10).forEach((item, idx) => {
      doc.text(
        `${idx + 1}. ${item.name} (${item.category}) - ${item.order_frequency} orders | $${item.revenue.toFixed(2)}`,
        { indent: 20 }
      );
    });
    doc.moveDown();

    doc.fontSize(9).font('Helvetica').text(
      `Generated: ${new Date().toISOString()}`,
      { align: 'center', color: '#999999' }
    );

    doc.end();
    return doc;
  }
}

module.exports = new ReportsService();
