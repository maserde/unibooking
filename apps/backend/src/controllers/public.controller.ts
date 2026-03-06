import type { Request, Response } from 'express';
import { merchantRepository } from '../repositories/merchant.repository';
import { assetRepository } from '../repositories/asset.repository';
import { assetUnitRepository } from '../repositories/assetUnit.repository';
import { bookingService } from '../services/booking.service';
import { promoService } from '../services/promo.service';
import { successResponse } from '../utils/apiResponse';
import { AppError } from '../middleware/error.middleware';

export const publicController = {
  async getCatalog(req: Request, res: Response): Promise<void> {
    const merchant = await merchantRepository.findBySlug(req.params.slug);
    if (!merchant) throw new AppError('Store not found', 404);

    const assets = await assetRepository.findAll(merchant.id);

    // Add available units count per asset
    const catalog = await Promise.all(
      assets.map(async (asset) => {
        const units = await assetUnitRepository.findAvailableByAsset(asset.id);
        return { ...asset, available_units_count: units.length };
      }),
    );

    successResponse(res, {
      merchant: {
        id: merchant.id,
        name: merchant.name,
        slug: merchant.slug,
        phone: merchant.phone,
        address: merchant.address,
      },
      catalog,
    });
  },

  async checkAvailability(req: Request, res: Response): Promise<void> {
    const { slug, assetId } = req.params;
    const { start_time, end_time } = req.query as { start_time: string; end_time: string };

    if (!start_time || !end_time) {
      throw new AppError('start_time and end_time are required', 422);
    }

    const result = await bookingService.checkAvailability(
      slug,
      assetId,
      new Date(start_time),
      new Date(end_time),
    );
    successResponse(res, result);
  },

  async createBooking(req: Request, res: Response): Promise<void> {
    const { booking, payment } = await bookingService.createBooking({
      slug: req.params.slug,
      assetId: req.body.asset_id,
      startTime: new Date(req.body.start_time),
      endTime: new Date(req.body.end_time),
      customerName: req.body.customer_name,
      customerEmail: req.body.customer_email,
      customerPhone: req.body.customer_phone,
      promoCode: req.body.promo_code,
    });

    successResponse(
      res,
      {
        booking: {
          id: booking.id,
          status: booking.status,
          total_price: booking.total_price,
          upfront_fee: booking.upfront_fee,
          discount_amount: booking.discount_amount,
          start_time: booking.start_time,
          end_time: booking.end_time,
        },
        payment_link: payment.payment_link,
      },
      'Booking created successfully',
      201,
    );
  },

  async validatePromo(req: Request, res: Response): Promise<void> {
    const merchant = await merchantRepository.findBySlug(req.params.slug);
    if (!merchant) throw new AppError('Store not found', 404);

    const { code, total_price } = req.body;
    const result = await promoService.validatePromo(merchant.id, code, total_price);

    successResponse(res, {
      discount_amount: result.discountAmount,
      discount_type: result.promo.discount_type,
      discount_value: result.promo.discount_value,
    });
  },
};
