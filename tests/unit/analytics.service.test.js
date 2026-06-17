jest.mock('../../src/config/db', () => ({
  bill: {
    aggregate: jest.fn(),
    groupBy: jest.fn()
  },
  order: { count: jest.fn() },
  orderItem: { groupBy: jest.fn() },
  menuItem: { findUnique: jest.fn() }
}));

const prisma = require('../../src/config/db');
const analyticsService = require('../../src/services/analytics.service');

beforeEach(() => jest.clearAllMocks());

describe('AnalyticsService.getDashboardMetrics()', () => {
  const mockSetup = () => {
    prisma.bill.aggregate.mockResolvedValue({ _sum: { total: 100 } });
    prisma.order.count
      .mockResolvedValueOnce(5) // order count
      .mockResolvedValueOnce(2); // active orders
    prisma.orderItem.groupBy.mockResolvedValue([]);
  };

  test('accepts a date string without crashing', async () => {
    mockSetup();
    await expect(
      analyticsService.getDashboardMetrics('2024-01-15')
    ).resolves.not.toThrow();
  });

  test('accepts a Date object without crashing', async () => {
    mockSetup();
    await expect(
      analyticsService.getDashboardMetrics(new Date('2024-01-15'))
    ).resolves.not.toThrow();
  });

  test('returns a string date in the response (not a Date object)', async () => {
    mockSetup();
    const result = await analyticsService.getDashboardMetrics('2024-01-15');
    expect(typeof result.date).toBe('string');
    expect(result.date).toBe('2024-01-15');
  });

  test('calculates avgOrderValue correctly', async () => {
    prisma.bill.aggregate.mockResolvedValue({ _sum: { total: 300 } });
    prisma.order.count.mockResolvedValueOnce(3).mockResolvedValueOnce(1);
    prisma.orderItem.groupBy.mockResolvedValue([]);

    const result = await analyticsService.getDashboardMetrics('2024-01-15');
    expect(result.metrics.avg_order_value).toBe(100);
  });

  test('returns 0 avgOrderValue when no orders', async () => {
    prisma.bill.aggregate.mockResolvedValue({ _sum: { total: null } });
    prisma.order.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    prisma.orderItem.groupBy.mockResolvedValue([]);

    const result = await analyticsService.getDashboardMetrics('2024-01-15');
    expect(result.metrics.avg_order_value).toBe(0);
    expect(result.metrics.total_revenue).toBe(0);
  });

  test('uses UTC midnight for date boundaries (BUG 6 fix)', async () => {
    mockSetup();
    await analyticsService.getDashboardMetrics('2024-01-15');

    const callArgs = prisma.bill.aggregate.mock.calls[0][0];
    const { gte, lte } = callArgs.where.closedAt;

    // Both should be UTC-based dates, not shifted by local timezone
    expect(gte.toISOString()).toMatch(/^2024-01-15T00:00:00\.000Z$/);
    expect(lte.toISOString()).toMatch(/^2024-01-15T23:59:59\.999Z$/);
  });
});

describe('AnalyticsService date edge cases', () => {
  test('handles end-of-month date correctly', async () => {
    prisma.bill.aggregate.mockResolvedValue({ _sum: { total: null } });
    prisma.order.count.mockResolvedValue(0);
    prisma.orderItem.groupBy.mockResolvedValue([]);

    await expect(
      analyticsService.getDashboardMetrics('2024-01-31')
    ).resolves.not.toThrow();
  });

  test('handles leap year date correctly', async () => {
    prisma.bill.aggregate.mockResolvedValue({ _sum: { total: null } });
    prisma.order.count.mockResolvedValue(0);
    prisma.orderItem.groupBy.mockResolvedValue([]);

    await expect(
      analyticsService.getDashboardMetrics('2024-02-29')
    ).resolves.not.toThrow();
  });
});
