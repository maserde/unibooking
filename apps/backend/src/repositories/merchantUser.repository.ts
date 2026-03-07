import { query, queryOne, execute } from '../config/database';
import type { MerchantUser } from '../types/models';
import type { MerchantUserRole } from '../types/enums';
import { generateUuid } from '../utils/uuid';

export const merchantUserRepository = {
  async create(data: {
    merchantId: string;
    email: string;
    passwordHash: string;
    fullName: string;
    role: MerchantUserRole;
    emailVerificationToken: string;
    isEmailVerified?: boolean;
  }): Promise<MerchantUser> {
    const id = generateUuid();
    await execute(
      `INSERT INTO merchant_users
        (id, merchant_id, email, password_hash, full_name, role, is_email_verified, email_verification_token)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.merchantId,
        data.email,
        data.passwordHash,
        data.fullName,
        data.role,
        data.isEmailVerified ?? false,
        data.emailVerificationToken,
      ],
    );
    return (await this.findById(id))!;
  },

  async findById(id: string): Promise<MerchantUser | null> {
    return queryOne<MerchantUser>('SELECT * FROM merchant_users WHERE id = ?', [id]);
  },

  async findByEmail(email: string): Promise<MerchantUser | null> {
    return queryOne<MerchantUser>('SELECT * FROM merchant_users WHERE email = ?', [email]);
  },

  async findByVerificationToken(token: string): Promise<MerchantUser | null> {
    return queryOne<MerchantUser>(
      'SELECT * FROM merchant_users WHERE email_verification_token = ?',
      [token],
    );
  },

  async markEmailVerified(id: string): Promise<void> {
    await execute(
      'UPDATE merchant_users SET is_email_verified = TRUE, email_verification_token = NULL WHERE id = ?',
      [id],
    );
  },

  async findByMerchantId(merchantId: string): Promise<MerchantUser[]> {
    return query<MerchantUser>(
      'SELECT * FROM merchant_users WHERE merchant_id = ? ORDER BY created_at ASC',
      [merchantId],
    );
  },

  async update(
    id: string,
    merchantId: string,
    data: Partial<Pick<MerchantUser, 'full_name' | 'role'>>,
  ): Promise<void> {
    const fields = Object.keys(data)
      .map((k) => `${k} = ?`)
      .join(', ');
    await execute(
      `UPDATE merchant_users SET ${fields} WHERE id = ? AND merchant_id = ?`,
      [...Object.values(data), id, merchantId],
    );
  },

  async delete(id: string, merchantId: string): Promise<void> {
    await execute('DELETE FROM merchant_users WHERE id = ? AND merchant_id = ?', [id, merchantId]);
  },
};
