import type { Request, Response } from 'express';
import { magicLinkService } from '../services/magicLink.service';
import { bookingRepository } from '../repositories/booking.repository';
import { merchantRepository } from '../repositories/merchant.repository';
import { successResponse } from '../utils/apiResponse';
import { AppError } from '../middleware/error.middleware';

export const customerPortalController = {
  async requestMagicLink(req: Request, res: Response): Promise<void> {
    const { email, merchant_slug } = req.body;

    const merchant = await merchantRepository.findBySlug(merchant_slug);
    if (!merchant) throw new AppError('Store not found', 404);

    await magicLinkService.requestLink(merchant.id, email, merchant_slug);
    // Always respond with success to avoid user enumeration
    successResponse(res, null, 'If an account exists, a login link has been sent to your email.');
  },

  async verifyMagicLink(req: Request, res: Response): Promise<void> {
    const { token } = req.params;
    const result = await magicLinkService.verifyToken(token);
    successResponse(res, { token: result.jwtToken });
  },

  async getBookings(req: Request, res: Response): Promise<void> {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await bookingRepository.findByCustomerAcrossMerchants(
      req.customerId!,
      page,
      limit,
    );
    successResponse(res, result);
  },

  async getBookingDetail(req: Request, res: Response): Promise<void> {
    const booking = await bookingRepository.findByIdPublicDetailed(req.params.id);
    if (!booking || booking.customer_id !== req.customerId) {
      throw new AppError('Booking not found', 404);
    }
    successResponse(res, booking);
  },
};
