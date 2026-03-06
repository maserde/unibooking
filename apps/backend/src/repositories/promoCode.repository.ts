import { query, queryOne, execute } from '../config/database';
import type { PromoCode } from '../types/models';
import { generateUuid } from '../utils/uuid';

export const promoCodeRepository = {
  async create(
    merchantId: string,
    data: Omit<PromoCode, 'id' | 'merchant_id' | 'created_at' | 'updated_at'>,
  ): Promise<PromoCode> {
    const id = generateUuid();
    await execute(
      `INSERT INTO promo_codes
        (id, merchant_id, code, discount_type, discount_value, max_discount_amount,
         min_transaction_amount, valid_from, valid_until, max_usage, max_usage_per_customer, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, merchantId, data.code, data.discount_type, data.discount_value,
        data.max_discount_amount ?? null, data.min_transaction_amount ?? null,
        data.valid_from, data.valid_until,
        data.max_usage ?? null, data.max_usage_per_customer ?? null,
        data.is_active,
      ],
    );
    return (await this.findById(merchantId, id))!;
  },

  async findById(merchantId: string, id: string): Promise<PromoCode | null> {
    return queryOne<PromoCode>(
      'SELECT * FROM promo_codes WHERE id = ? AND merchant_id = ?',
      [id, merchantId],
    );
  },

  async findByCode(merchantId: string, code: string): Promise<PromoCode | null> {
    return queryOne<PromoCode>(
      'SELECT * FROM promo_codes WHERE merchant_id = ? AND code = ?',
      [merchantId, code],
    );
  },

  async findAll(merchantId: string): Promise<PromoCode[]> {
    return query<PromoCode>(
      'SELECT * FROM promo_codes WHERE merchant_id = ? ORDER BY created_at DESC',
      [merchantId],
    );
  },

  async update(
    merchantId: string,
    id: string,
    data: Partial<Omit<PromoCode, 'id' | 'merchant_id' | 'created_at' | 'updated_at'>>,
  ): Promise<void> {
    const fields = Object.keys(data)
      .map((k) => `${k} = ?`)
      .join(', ');
    await execute(
      `UPDATE promo_codes SET ${fields} WHERE id = ? AND merchant_id = ?`,
      [...Object.values(data), id, merchantId],
    );
  },

  async delete(merchantId: string, id: string): Promise<void> {
    await execute('DELETE FROM promo_codes WHERE id = ? AND merchant_id = ?', [id, merchantId]);
  },
};
