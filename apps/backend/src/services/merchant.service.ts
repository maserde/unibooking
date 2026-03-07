import axios from 'axios';
import { merchantRepository } from '../repositories/merchant.repository';
import { merchantUserRepository } from '../repositories/merchantUser.repository';
import { encryptionService } from './encryption.service';
import { AppError } from '../middleware/error.middleware';
import { env, MAYAR_BASE_URL } from '../config/env';
import { logger } from '../config/logger';
import type { Merchant } from '../types/models';

export const merchantService = {
  async getProfile(merchantId: string): Promise<Merchant> {
    const merchant = await merchantRepository.findById(merchantId);
    if (!merchant) throw new AppError('Merchant not found', 404);
    // Strip sensitive field
    const { mayar_api_key_encrypted: _, ...safe } = merchant;
    return safe as Merchant;
  },

  async updateProfile(
    merchantId: string,
    data: Partial<Pick<Merchant, 'name' | 'slug' | 'phone' | 'address' | 'upfront_fee_percentage'>>,
  ): Promise<Merchant> {
    if (data.slug) {
      const existing = await merchantRepository.findBySlug(data.slug);
      if (existing && existing.id !== merchantId) {
        throw new AppError('Slug already taken', 409);
      }
    }
    await merchantRepository.update(merchantId, data);
    return this.getProfile(merchantId);
  },

  async registerWebhook(merchantId: string, apiKey: string): Promise<'SUCCESS' | 'FAILED'> {
    let status: 'SUCCESS' | 'FAILED' = 'FAILED';
    try {
      await axios.post(
        `${MAYAR_BASE_URL}/webhook/register`,
        { urlHook: `${env.APP_URL}/api/webhooks/mayar` },
        { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 10000 },
      );
      status = 'SUCCESS';
    } catch (err) {
      logger.warn('Failed to register Mayar webhook', { merchantId, err });
    }
    await merchantRepository.setWebhookStatus(merchantId, status);
    return status;
  },

  async setupPayment(merchantId: string, apiKey: string): Promise<void> {
    // Validate key against Mayar API
    try {
      await axios.get(`${MAYAR_BASE_URL}/customer`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 10000,
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        throw new AppError('Invalid Mayar API key', 422);
      }
      // If Mayar is down, we still accept the key to avoid blocking setup
    }

    const encrypted = encryptionService.encryptApiKey(apiKey);
    await merchantRepository.setMayarKey(merchantId, encrypted);
    await this.registerWebhook(merchantId, apiKey);
  },

  async retryWebhookRegistration(merchantId: string): Promise<'SUCCESS' | 'FAILED'> {
    const merchant = await merchantRepository.findById(merchantId);
    if (!merchant) throw new AppError('Merchant not found', 404);
    if (!merchant.mayar_api_key_encrypted) throw new AppError('No API key configured', 422);

    const apiKey = encryptionService.decryptApiKey(merchant.mayar_api_key_encrypted);
    return this.registerWebhook(merchantId, apiKey);
  },

  async getMerchantWithUsers(merchantId: string) {
    const merchant = await this.getProfile(merchantId);
    const users = await merchantUserRepository.findByMerchantId(merchantId);
    return { merchant, staff: users.map(({ password_hash: _, email_verification_token: __, ...u }) => u) };
  },
};
