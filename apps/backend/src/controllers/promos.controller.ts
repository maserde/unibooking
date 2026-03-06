import type { Request, Response } from 'express';
import { promoService } from '../services/promo.service';
import { successResponse } from '../utils/apiResponse';

export const promosController = {
  async list(req: Request, res: Response): Promise<void> {
    const promos = await promoService.listPromos(req.merchantId!);
    successResponse(res, promos);
  },

  async create(req: Request, res: Response): Promise<void> {
    const promo = await promoService.createPromo(req.merchantId!, {
      ...req.body,
      valid_from: new Date(req.body.valid_from),
      valid_until: new Date(req.body.valid_until),
    });
    successResponse(res, promo, 'Promo code created', 201);
  },

  async update(req: Request, res: Response): Promise<void> {
    const data = { ...req.body };
    if (data.valid_from) data.valid_from = new Date(data.valid_from);
    if (data.valid_until) data.valid_until = new Date(data.valid_until);
    const promo = await promoService.updatePromo(req.merchantId!, req.params.id, data);
    successResponse(res, promo);
  },

  async delete(req: Request, res: Response): Promise<void> {
    await promoService.deletePromo(req.merchantId!, req.params.id);
    successResponse(res, null, 'Promo code deleted');
  },
};
