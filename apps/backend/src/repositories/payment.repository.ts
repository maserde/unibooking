import { query, queryOne, execute } from '../config/database';
import type { Payment } from '../types/models';
import type { PaymentStatus } from '../types/enums';
import { generateUuid } from '../utils/uuid';

export const paymentRepository = {
  async create(data: {
    bookingId: string;
    amount: number;
    mayarTransactionId?: string;
    paymentLink?: string;
  }): Promise<Payment> {
    const id = generateUuid();
    await execute(
      `INSERT INTO payments (id, booking_id, amount, mayar_transaction_id, payment_link)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        data.bookingId,
        data.amount,
        data.mayarTransactionId ?? null,
        data.paymentLink ?? null,
      ],
    );
    return (await this.findByBookingId(data.bookingId))!;
  },

  async findByBookingId(bookingId: string): Promise<Payment | null> {
    return queryOne<Payment>('SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC LIMIT 1', [bookingId]);
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
