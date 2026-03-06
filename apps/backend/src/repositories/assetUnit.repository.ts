import { query, queryOne, execute } from '../config/database';
import type { AssetUnit } from '../types/models';
import type { AssetUnitStatus } from '../types/enums';
import { generateUuid } from '../utils/uuid';

export const assetUnitRepository = {
  async create(
    assetId: string,
    identifier: string,
  ): Promise<AssetUnit> {
    const id = generateUuid();
    await execute(
      'INSERT INTO asset_units (id, asset_id, identifier) VALUES (?, ?, ?)',
      [id, assetId, identifier],
    );
    return (await this.findById(id))!;
  },

  async findById(id: string): Promise<AssetUnit | null> {
    return queryOne<AssetUnit>('SELECT * FROM asset_units WHERE id = ?', [id]);
  },

  async findByAssetId(assetId: string): Promise<AssetUnit[]> {
    return query<AssetUnit>(
      'SELECT * FROM asset_units WHERE asset_id = ? ORDER BY identifier ASC',
      [assetId],
    );
  },

  async findAvailableByAsset(assetId: string): Promise<AssetUnit[]> {
    return query<AssetUnit>(
      "SELECT * FROM asset_units WHERE asset_id = ? AND status = 'AVAILABLE'",
      [assetId],
    );
  },

  async update(
    id: string,
    data: Partial<Pick<AssetUnit, 'identifier' | 'status'>>,
  ): Promise<void> {
    const fields = Object.keys(data)
      .map((k) => `${k} = ?`)
      .join(', ');
    await execute(
      `UPDATE asset_units SET ${fields} WHERE id = ?`,
      [...Object.values(data), id],
    );
  },

  async delete(id: string): Promise<void> {
    await execute('DELETE FROM asset_units WHERE id = ?', [id]);
  },

  async updateStatus(id: string, status: AssetUnitStatus): Promise<void> {
    await execute('UPDATE asset_units SET status = ? WHERE id = ?', [status, id]);
  },

  /**
   * Check if a unit belongs to a merchant (for auth verification).
   */
  async belongsToMerchant(unitId: string, merchantId: string): Promise<boolean> {
    const row = await queryOne<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM asset_units au
       JOIN assets a ON a.id = au.asset_id
       WHERE au.id = ? AND a.merchant_id = ?`,
      [unitId, merchantId],
    );
    return (row?.cnt ?? 0) > 0;
  },
};
