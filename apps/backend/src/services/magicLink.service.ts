import crypto from 'crypto';
import { customerRepository } from '../repositories/customer.repository';
import { magicLinkRepository } from '../repositories/magicLink.repository';
import { signCustomerToken } from '../utils/jwt';
import { notificationService } from './notification.service';
import { AppError } from '../middleware/error.middleware';

const MAGIC_LINK_TTL_MINUTES = 15;

export const magicLinkService = {
  async requestLink(merchantId: string, email: string): Promise<void> {
    const customer = await customerRepository.findByEmail(merchantId, email);
    if (!customer) {
      // Return silently to avoid user enumeration
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000);

    await magicLinkRepository.create(customer.id, token, expiresAt);
    await notificationService.sendMagicLink(email, token, merchantId);
  },

  async verifyToken(token: string): Promise<{ jwtToken: string }> {
    const link = await magicLinkRepository.findByToken(token);

    if (!link) throw new AppError('Invalid or expired link', 400);
    if (link.is_used) throw new AppError('This link has already been used', 400);
    if (new Date() > link.expires_at) throw new AppError('Link has expired', 400);

    await magicLinkRepository.markUsed(link.id);

    // We need customer to get merchantId
    // Customer ID is on the link, we need to find the customer
    const { query } = await import('../config/database');
    const rows = await query<{ merchant_id: string }>(
      'SELECT merchant_id FROM customers WHERE id = ?',
      [link.customer_id],
    );
    if (!rows[0]) throw new AppError('Customer not found', 404);

    const jwtToken = signCustomerToken({
      sub: link.customer_id,
      merchantId: rows[0].merchant_id,
    });

    return { jwtToken };
  },
};
