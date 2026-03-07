import type { Request, Response } from 'express';
import { merchantService } from '../services/merchant.service';
import { successResponse } from '../utils/apiResponse';
import { AppError } from '../middleware/error.middleware';
import { env } from '../config/env';

function withStorefrontUrl<T extends { slug: string }>(merchant: T) {
  return { ...merchant, storefront_url: `${env.FRONTEND_URL}/store/${merchant.slug}` };
}

export const merchantController = {
  async getProfile(req: Request, res: Response): Promise<void> {
    const profile = await merchantService.getProfile(req.merchantId!);
    successResponse(res, withStorefrontUrl(profile));
  },

  async updateProfile(req: Request, res: Response): Promise<void> {
    const updated = await merchantService.updateProfile(req.merchantId!, req.body);
    successResponse(res, withStorefrontUrl(updated));
  },

  async uploadLogo(req: Request, res: Response): Promise<void> {
    if (!req.file) throw new AppError('Logo file is required', 422);
    const merchant = await merchantService.uploadLogo(req.merchantId!, req.file.buffer);
    successResponse(res, withStorefrontUrl(merchant), 'Logo updated');
  },

  async setupPayment(req: Request, res: Response): Promise<void> {
    await merchantService.setupPayment(req.merchantId!, req.body.api_key);
    successResponse(res, null, 'Payment gateway configured successfully');
  },

  async getWebhookInfo(req: Request, res: Response): Promise<void> {
    const { merchantRepository } = await import('../repositories/merchant.repository');
    const merchant = await merchantRepository.findById(req.merchantId!);
    successResponse(res, {
      webhook_url: `${env.APP_URL}/api/webhooks/mayar`,
      webhook_status: merchant?.mayar_webhook_status ?? null,
      has_api_key: !!merchant?.mayar_api_key_encrypted,
    });
  },

  async retryWebhookRegister(req: Request, res: Response): Promise<void> {
    const status = await merchantService.retryWebhookRegistration(req.merchantId!);
    successResponse(res, { webhook_status: status },
      status === 'SUCCESS' ? 'Webhook registered successfully' : 'Webhook registration failed');
  },
};
