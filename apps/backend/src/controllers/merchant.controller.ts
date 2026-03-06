import type { Request, Response } from 'express';
import { merchantService } from '../services/merchant.service';
import { successResponse } from '../utils/apiResponse';

export const merchantController = {
  async getProfile(req: Request, res: Response): Promise<void> {
    const profile = await merchantService.getProfile(req.merchantId!);
    successResponse(res, profile);
  },

  async updateProfile(req: Request, res: Response): Promise<void> {
    const updated = await merchantService.updateProfile(req.merchantId!, req.body);
    successResponse(res, updated);
  },

  async setupPayment(req: Request, res: Response): Promise<void> {
    await merchantService.setupPayment(req.merchantId!, req.body.api_key);
    successResponse(res, null, 'Payment gateway configured successfully');
  },
};
