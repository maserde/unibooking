import { query, queryOne, execute } from '../config/database';
import type { Merchant } from '../types/models';
import { generateUuid } from '../utils/uuid';

export interface CreateMerchantData {
  name: string;
  slug: string;
  phone?: string;
  address?: string;
}

export const merchantRepository = {
  async create(data: CreateMerchantData): Promise<Merchant> {
    const id = generateUuid();
    await execute(
      'INSERT INTO merchants (id, name, slug, phone, address) VALUES (?, ?, ?, ?, ?)',
      [id, data.name, data.slug, data.phone ?? null, data.address ?? null],
    );
    return (await this.findById(id))!;
  },

  async findById(id: string): Promise<Merchant | null> {
    return queryOne<Merchant>('SELECT * FROM merchants WHERE id = ?', [id]);
  },

  async findBySlug(slug: string): Promise<Merchant | null> {
    return queryOne<Merchant>('SELECT * FROM merchants WHERE slug = ?', [slug]);
  },

  async isSlugTaken(slug: string): Promise<boolean> {
    const row = await queryOne<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM merchants WHERE slug = ?',
      [slug],
    );
    return (row?.cnt ?? 0) > 0;
  },

  async update(
    id: string,
    data: Partial<Pick<Merchant, 'name' | 'slug' | 'phone' | 'address' | 'upfront_fee_percentage'>>,
  ): Promise<void> {
    const fields = Object.keys(data)
      .map((k) => `${k} = ?`)
      .join(', ');
    const values = [...Object.values(data), id];
    await execute(`UPDATE merchants SET ${fields} WHERE id = ?`, values);
  },

  async setMayarKey(id: string, encrypted: string): Promise<void> {
    await execute('UPDATE merchants SET mayar_api_key_encrypted = ? WHERE id = ?', [encrypted, id]);
  },
};
