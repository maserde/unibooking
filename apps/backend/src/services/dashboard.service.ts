import { query, queryOne } from '../config/database';

export const dashboardService = {
  async getStats(merchantId: string): Promise<Record<string, unknown>> {
    const [
      activeBookings,
      todayRevenue,
      unitsRented,
      totalCustomers,
      pendingPayments,
      recentBookings,
    ] = await Promise.all([
      queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM bookings WHERE merchant_id = ? AND status = 'ACTIVE'",
        [merchantId],
      ),
      queryOne<{ revenue: number }>(
        `SELECT COALESCE(SUM(p.amount), 0) as revenue
         FROM payments p
         JOIN bookings b ON b.id = p.booking_id
         WHERE b.merchant_id = ?
           AND p.status = 'PAID'
           AND DATE(p.created_at) = CURDATE()`,
        [merchantId],
      ),
      queryOne<{ count: number }>(
        `SELECT COUNT(DISTINCT b.asset_unit_id) as count
         FROM bookings b
         WHERE b.merchant_id = ? AND b.status = 'ACTIVE'`,
        [merchantId],
      ),
      queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM customers WHERE merchant_id = ?',
        [merchantId],
      ),
      queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM bookings WHERE merchant_id = ? AND status = 'PENDING_PAYMENT'",
        [merchantId],
      ),
      query<Record<string, unknown>>(
        `SELECT b.id, b.status, b.total_price, b.start_time, b.end_time, b.created_at,
                c.name as customer_name, c.email as customer_email,
                a.name as asset_name
         FROM bookings b
         JOIN customers c ON c.id = b.customer_id
         JOIN asset_units au ON au.id = b.asset_unit_id
         JOIN assets a ON a.id = au.asset_id
         WHERE b.merchant_id = ?
         ORDER BY b.created_at DESC
         LIMIT 10`,
        [merchantId],
      ),
    ]);

    return {
      active_bookings: activeBookings?.count ?? 0,
      today_revenue: todayRevenue?.revenue ?? 0,
      units_currently_rented: unitsRented?.count ?? 0,
      total_customers: totalCustomers?.count ?? 0,
      pending_payments: pendingPayments?.count ?? 0,
      recent_bookings: recentBookings,
    };
  },
};
