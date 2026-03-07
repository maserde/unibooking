import { query, queryOne, execute, pool } from '../config/database';
import type { Booking } from '../types/models';
import type { BookingStatus } from '../types/enums';
import { generateUuid } from '../utils/uuid';

export interface CreateBookingData {
  merchantId: string;
  customerId: string;
  assetUnitId: string;
  promoCodeId?: string | null;
  startTime: Date;
  endTime: Date;
  totalPrice: number;
  upfrontFee: number;
  discountAmount: number;
}

export const bookingRepository = {
  async create(data: CreateBookingData): Promise<Booking> {
    const id = generateUuid();
    await execute(
      `INSERT INTO bookings
        (id, merchant_id, customer_id, asset_unit_id, promo_code_id,
         start_time, end_time, total_price, upfront_fee, discount_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_PAYMENT')`,
      [
        id,
        data.merchantId,
        data.customerId,
        data.assetUnitId,
        data.promoCodeId ?? null,
        data.startTime,
        data.endTime,
        data.totalPrice,
        data.upfrontFee,
        data.discountAmount,
      ],
    );
    return (await this.findById(data.merchantId, id))!;
  },

  async findById(merchantId: string, id: string): Promise<Booking | null> {
    return queryOne<Booking>(
      'SELECT * FROM bookings WHERE id = ? AND merchant_id = ?',
      [id, merchantId],
    );
  },

  async findByIdPublic(id: string): Promise<Booking | null> {
    return queryOne<Booking>('SELECT * FROM bookings WHERE id = ?', [id]);
  },

  async findByIdPublicDetailed(id: string): Promise<Record<string, unknown> | null> {
    const rows = await query<Record<string, unknown>>(
      `SELECT b.*,
        au.identifier as unit_identifier, au.status as unit_status,
        a.name as asset_name, a.type as asset_type, a.price_unit,
        p.id as payment_id, p.payment_link, p.amount as payment_amount, p.status as payment_status,
        p.mayar_transaction_id
       FROM bookings b
       JOIN asset_units au ON au.id = b.asset_unit_id
       JOIN assets a ON a.id = au.asset_id
       LEFT JOIN payments p ON p.booking_id = b.id
       WHERE b.id = ?`,
      [id],
    );
    return rows[0] ?? null;
  },

  async findAll(
    merchantId: string,
    options: { status?: BookingStatus; page: number; limit: number; search?: string },
  ): Promise<{ bookings: Record<string, unknown>[]; total: number }> {
    const offset = (options.page - 1) * options.limit;
    const conditions = ['b.merchant_id = ?'];
    const params: unknown[] = [merchantId];

    if (options.status) {
      conditions.push('b.status = ?');
      params.push(options.status);
    }

    if (options.search) {
      conditions.push('(c.name LIKE ? OR b.id LIKE ?)');
      const like = `%${options.search}%`;
      params.push(like, like);
    }

    const where = conditions.join(' AND ');
    const bookings = await query<Record<string, unknown>>(
      `SELECT b.*, c.name as customer_name
       FROM bookings b
       JOIN customers c ON c.id = b.customer_id
       WHERE ${where} ORDER BY b.created_at DESC LIMIT ? OFFSET ?`,
      [...params, options.limit, offset],
    );
    const countRow = await queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM bookings b JOIN customers c ON c.id = b.customer_id WHERE ${where}`,
      params,
    );
    return { bookings, total: countRow?.total ?? 0 };
  },

  async findByCustomer(
    merchantId: string,
    customerId: string,
    page: number,
    limit: number,
  ): Promise<{ bookings: Booking[]; total: number }> {
    const offset = (page - 1) * limit;
    const bookings = await query<Booking>(
      'SELECT * FROM bookings WHERE merchant_id = ? AND customer_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [merchantId, customerId, Math.trunc(limit), Math.trunc(offset)],
    );
    const countRow = await queryOne<{ total: number }>(
      'SELECT COUNT(*) as total FROM bookings WHERE merchant_id = ? AND customer_id = ?',
      [merchantId, customerId],
    );
    return { bookings, total: countRow?.total ?? 0 };
  },

  async findByCustomerAcrossMerchants(
    customerId: string,
    page: number,
    limit: number,
  ): Promise<{ bookings: Booking[]; total: number }> {
    const offset = (page - 1) * limit;
    const bookings = await query<Booking>(
      'SELECT * FROM bookings WHERE customer_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [customerId, limit, offset],
    );
    const countRow = await queryOne<{ total: number }>(
      'SELECT COUNT(*) as total FROM bookings WHERE customer_id = ?',
      [customerId],
    );
    return { bookings, total: countRow?.total ?? 0 };
  },

  async updateStatus(merchantId: string, id: string, status: BookingStatus): Promise<void> {
    await execute(
      'UPDATE bookings SET status = ? WHERE id = ? AND merchant_id = ?',
      [status, id, merchantId],
    );
  },

  /**
   * Find available asset units for the given asset and time range.
   */
  async findAvailableUnits(
    assetId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<{ id: string }[]> {
    return query<{ id: string }>(
      `SELECT au.id FROM asset_units au
       WHERE au.asset_id = ? AND au.status = 'AVAILABLE'
       AND au.id NOT IN (
         SELECT b.asset_unit_id FROM bookings b
         WHERE b.asset_unit_id = au.id
           AND b.status IN ('PENDING_PAYMENT','CONFIRMED','ACTIVE')
           AND b.start_time < ?
           AND b.end_time   > ?
       )`,
      [assetId, endTime, startTime],
    );
  },

  async countPromoUsage(promoCodeId: string): Promise<number> {
    const row = await queryOne<{ cnt: number }>(
      "SELECT COUNT(*) as cnt FROM bookings WHERE promo_code_id = ? AND status != 'CANCELLED'",
      [promoCodeId],
    );
    return row?.cnt ?? 0;
  },

  async countPromoUsageByCustomer(promoCodeId: string, customerId: string): Promise<number> {
    const row = await queryOne<{ cnt: number }>(
      "SELECT COUNT(*) as cnt FROM bookings WHERE promo_code_id = ? AND customer_id = ? AND status != 'CANCELLED'",
      [promoCodeId, customerId],
    );
    return row?.cnt ?? 0;
  },

  async findDetailedById(merchantId: string, id: string): Promise<Record<string, unknown> | null> {
    const rows = await query<Record<string, unknown>>(
      `SELECT b.*,
        c.name as customer_name, c.email as customer_email, c.phone_number as customer_phone,
        au.identifier as unit_identifier, au.status as unit_status,
        a.name as asset_name, a.type as asset_type, a.price_unit,
        p.id as payment_id, p.payment_link, p.amount as payment_amount, p.status as payment_status,
        p.mayar_transaction_id
       FROM bookings b
       JOIN customers c ON c.id = b.customer_id
       JOIN asset_units au ON au.id = b.asset_unit_id
       JOIN assets a ON a.id = au.asset_id
       LEFT JOIN payments p ON p.booking_id = b.id
       WHERE b.id = ? AND b.merchant_id = ?`,
      [id, merchantId],
    );
    return rows[0] ?? null;
  },
};
