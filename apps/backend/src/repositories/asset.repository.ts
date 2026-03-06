import { query, queryOne, execute } from '../config/database';
import type { Asset } from '../types/models';
import type { AssetType, PriceUnit } from '../types/enums';
import { generateUuid } from '../utils/uuid';

export const assetRepository = {
  async create(
    merchantId: string,
    data: {
      type: AssetType;
      name: string;
      base_price: number;
      price_unit: PriceUnit;
      attributes?: Record<string, unknown> | null;
    },
  ): Promise<Asset> {
    const id = generateUuid();
    await execute(
      'INSERT INTO assets (id, merchant_id, type, name, base_price, price_unit, attributes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        merchantId,
        data.type,
        data.name,
        data.base_price,
        data.price_unit,
        data.attributes ? JSON.stringify(data.attributes) : null,
      ],
    );
    return (await this.findById(merchantId, id))!;
  },

  async findById(merchantId: string, id: string): Promise<Asset | null> {
    const row = await queryOne<Asset & { attributes: string | null }>(
      'SELECT * FROM assets WHERE id = ? AND merchant_id = ?',
      [id, merchantId],
    );
    if (!row) return null;
    return this.parseAsset(row);
  },

  async findAll(merchantId: string): Promise<Asset[]> {
    const rows = await query<Asset & { attributes: string | null }>(
      'SELECT * FROM assets WHERE merchant_id = ? ORDER BY created_at DESC',
      [merchantId],
    );
    return rows.map(this.parseAsset);
  },

  async findBySlug(merchantId: string): Promise<Asset[]> {
    return this.findAll(merchantId);
  },

  async update(
    merchantId: string,
    id: string,
    data: Partial<Pick<Asset, 'name' | 'base_price' | 'price_unit' | 'attributes'>>,
  ): Promise<void> {
    const { attributes, ...rest } = data;
    const updateData: Record<string, unknown> = { ...rest };
    if (attributes !== undefined) {
      updateData.attributes = attributes ? JSON.stringify(attributes) : null;
    }
    const fields = Object.keys(updateData)
      .map((k) => `${k} = ?`)
      .join(', ');
    await execute(
      `UPDATE assets SET ${fields} WHERE id = ? AND merchant_id = ?`,
      [...Object.values(updateData), id, merchantId],
    );
  },

  async delete(merchantId: string, id: string): Promise<void> {
    await execute('DELETE FROM assets WHERE id = ? AND merchant_id = ?', [id, merchantId]);
  },

  parseAsset(row: Asset & { attributes: string | null }): Asset {
    return {
      ...row,
      attributes:
        row.attributes && typeof row.attributes === 'string'
          ? JSON.parse(row.attributes)
          : row.attributes,
    };
  },
};
