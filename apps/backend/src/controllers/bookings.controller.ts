import type { Request, Response } from 'express';
import { bookingRepository } from '../repositories/booking.repository';
import { bookingService } from '../services/booking.service';
import { successResponse } from '../utils/apiResponse';
import type { BookingStatus } from '../types/enums';

export const bookingsController = {
  async list(req: Request, res: Response): Promise<void> {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = req.query.status as BookingStatus | undefined;
    const result = await bookingRepository.findAll(req.merchantId!, { status, page, limit });
    successResponse(res, result);
  },

  async detail(req: Request, res: Response): Promise<void> {
    const booking = await bookingRepository.findDetailedById(req.merchantId!, req.params.id);
    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }
    successResponse(res, booking);
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const booking = await bookingService.updateStatus(
      req.merchantId!,
      req.params.id,
      req.body.status,
    );
    successResponse(res, booking);
  },
};
