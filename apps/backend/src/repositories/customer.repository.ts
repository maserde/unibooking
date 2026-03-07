import { query, queryOne, execute } from '../config/database';
import type { Customer } from '../types/models';
import { generateUuid } from '../utils/uuid';

export const customerRepository = {
  async findOrCreate(
    merchantId: string,
    data: { name: string; email: string; phone_number?: string },
  ): Promise<Customer> {
    const existing = await this.findByEmail(merchantId, data.email);
    if (existing) return existing;

    const id = generateUuid();
    await execute(
      'INSERT INTO customers (id, merchant_id, name, email, phone_number) VALUES (?, ?, ?, ?, ?)',
      [id, merchantId, data.name, data.email, data.phone_number ?? null],
    );
    return (await this.findById(merchantId, id))!;
  },

  async findById(merchantId: string, id: string): Promise<Customer | null> {
    return queryOne<Customer>(
      'SELECT * FROM customers WHERE id = ? AND merchant_id = ?',
      [id, merchantId],
    );
  },

  async findByEmail(merchantId: string, email: string): Promise<Customer | null> {
    return queryOne<Customer>(
      'SELECT * FROM customers WHERE merchant_id = ? AND email = ?',
      [merchantId, email],
    );
  },

  async findAll(
    merchantId: string,
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ customers: Customer[]; total: number }> {
    const offset = (page - 1) * limit;
    const conditions = ['merchant_id = ?'];
    const params: unknown[] = [merchantId];

    if (search) {
      conditions.push('(name LIKE ? OR email LIKE ? OR phone_number LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    const where = conditions.join(' AND ');
    const customers = await query<Customer>(
      `SELECT * FROM customers WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );
    const countRow = await queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM customers WHERE ${where}`,
      params,
    );
    return { customers, total: countRow?.total ?? 0 };
  },
};
