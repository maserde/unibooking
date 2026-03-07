import { query, queryOne, execute } from '../config/database';
import type { AssetImage } from '../types/models';
import { generateUuid } from '../utils/uuid';

export const assetImageRepository = {
  async findByAssetId(assetId: string): Promise<AssetImage[]> {
    return query<AssetImage>(
      'SELECT * FROM asset_images WHERE asset_id = ? ORDER BY sort_order ASC',
      [assetId],
    );
  },

  async findById(id: string): Promise<AssetImage | null> {
    return queryOne<AssetImage>('SELECT * FROM asset_images WHERE id = ?', [id]);
  },

  async countByAssetId(assetId: string): Promise<number> {
    const row = await queryOne<{ total: number }>(
      'SELECT COUNT(*) AS total FROM asset_images WHERE asset_id = ?',
      [assetId],
    );
    return row?.total ?? 0;
  },

  async create(assetId: string, s3Key: string, url: string, sortOrder: number): Promise<AssetImage> {
    const id = generateUuid();
    await execute(
      'INSERT INTO asset_images (id, asset_id, s3_key, url, sort_order) VALUES (?, ?, ?, ?, ?)',
      [id, assetId, s3Key, url, sortOrder],
    );
    return (await this.findById(id))!;
  },

  async delete(id: string): Promise<void> {
    await execute('DELETE FROM asset_images WHERE id = ?', [id]);
  },
};
