import { query, queryOne, execute } from '../config/database';
import type { Payment } from '../types/models';
import type { PaymentStatus, PaymentType } from '../types/enums';
import { generateUuid } from '../utils/uuid';

export const paymentRepository = {
  async create(data: {
    bookingId: string;
    amount: number;
    mayarTransactionId?: string;
    paymentLink?: string;
    paymentType?: PaymentType;
  }): Promise<Payment> {
    const id = generateUuid();
    await execute(
      `INSERT INTO payments (id, booking_id, amount, mayar_transaction_id, payment_link, payment_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.bookingId,
        data.amount,
        data.mayarTransactionId ?? null,
        data.paymentLink ?? null,
        data.paymentType ?? 'UPFRONT',
      ],
    );
    return (await this.findByIdDirect(id))!;
  },

  async findByIdDirect(id: string): Promise<Payment | null> {
    return queryOne<Payment>('SELECT * FROM payments WHERE id = ?', [id]);
  },

  async findByBookingId(bookingId: string): Promise<Payment | null> {
    return queryOne<Payment>(
      "SELECT * FROM payments WHERE booking_id = ? AND payment_type = 'UPFRONT' ORDER BY created_at DESC LIMIT 1",
      [bookingId],
    );
  },

  async findRemainderByBookingId(bookingId: string): Promise<Payment | null> {
    return queryOne<Payment>(
      "SELECT * FROM payments WHERE booking_id = ? AND payment_type = 'REMAINDER' ORDER BY created_at DESC LIMIT 1",
      [bookingId],
    );
  },

  async findByMayarTransactionId(transactionId: string): Promise<Payment | null> {
    return queryOne<Payment>(
      'SELECT * FROM payments WHERE mayar_transaction_id = ?',
      [transactionId],
    );
  },

  async updateStatus(id: string, status: PaymentStatus, transactionId?: string): Promise<void> {
    if (transactionId) {
      await execute(
        'UPDATE payments SET status = ?, mayar_transaction_id = ? WHERE id = ?',
        [status, transactionId, id],
      );
    } else {
      await execute('UPDATE payments SET status = ? WHERE id = ?', [status, id]);
    }
  },
};
