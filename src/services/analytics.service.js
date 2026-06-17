const prisma = require('../config/db');

class AnalyticsService {
  async getDashboardMetrics(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get revenue
    const revenue = await prisma.bill.aggregate({
      where: {
        closedAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      _sum: { total: true }
    });

    // Get order count
    const orderCount = await prisma.order.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Get active orders
    const activeOrders = await prisma.order.count({
      where: {
        status: 'ACTIVE',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Get top items (by order frequency - count of distinct orders)
    const topItems = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        order: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      },
      _count: {
        orderId: true
      },
      _sum: {
        quantity: true,
        unitPrice: true
      },
      orderBy: {
        _count: {
          orderId: 'desc'
        }
      },
      take: 5
    });

    // Get menu item details for top items
    const topItemsWithDetails = await Promise.all(
      topItems.map(async (item) => {
        const menuItem = await prisma.menuItem.findUnique({
          where: { id: item.menuItemId }
        });
        return {
          menu_item_id: item.menuItemId,
          name: menuItem.name,
          category: menuItem.category,
          order_frequency: item._count.orderId,
          total_quantity: item._sum.quantity || 0
        };
      })
    );

    const totalRevenue = parseFloat(revenue._sum.total || 0);
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    return {
      date: typeof date === 'string' ? date : date.toISOString().split('T')[0],
      metrics: {
        total_revenue: totalRevenue,
        order_count: orderCount,
        avg_order_value: parseFloat(avgOrderValue.toFixed(2)),
        active_orders: activeOrders
      },
      top_items: topItemsWithDetails
    };
  }

  // Get category breakdown for a date
  async getCategoryBreakdown(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const breakdown = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        order: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      },
      _count: {
        orderId: true
      },
      _sum: {
        quantity: true,
        unitPrice: true
      }
    });

    // Get menu details and group by category
    const categoryMap = {};

    await Promise.all(
      breakdown.map(async (item) => {
        const menuItem = await prisma.menuItem.findUnique({
          where: { id: item.menuItemId }
        });
        
        const category = menuItem.category;
        if (!categoryMap[category]) {
          categoryMap[category] = {
            category,
            orders: 0,
            items_sold: 0,
            revenue: 0
          };
        }

        categoryMap[category].orders += item._count.orderId;
        categoryMap[category].items_sold += item._sum.quantity || 0;
        categoryMap[category].revenue += parseFloat((item._sum.unitPrice || 0).toString());
      })
    );

    return Object.values(categoryMap);
  }

  // Get audit logs with filtering
  async getAuditLogs(options = {}) {
    const {
      action = null,
      days = 7,
      limit = 100
    } = options;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: startDate
        },
        ...(action && { action })
      },
      include: {
        user: {
          select: { username: true }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit
    });

    return logs.map(log => ({
      log_id: log.id,
      user_id: log.userId,
      username: log.user?.username,
      action: log.action,
      resource: log.resource,
      success: log.success,
      ip_address: log.ipAddress,
      timestamp: log.timestamp,
      details: log.details
    }));
  }
}

module.exports = new AnalyticsService();
