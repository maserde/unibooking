import { queryOne, execute } from '../config/database';
import type { MagicLink } from '../types/models';
import { generateUuid } from '../utils/uuid';

export const magicLinkRepository = {
  async create(customerId: string, token: string, expiresAt: Date): Promise<MagicLink> {
    const id = generateUuid();
    await execute(
      'INSERT INTO magic_links (id, customer_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [id, customerId, token, expiresAt],
    );
    return (await this.findByToken(token))!;
  },

  async findByToken(token: string): Promise<MagicLink | null> {
    return queryOne<MagicLink>(
      'SELECT * FROM magic_links WHERE token = ?',
      [token],
    );
  },

  async markUsed(id: string): Promise<void> {
    await execute('UPDATE magic_links SET is_used = TRUE WHERE id = ?', [id]);
  },
};
