import type { Request, Response } from 'express';
import { customerRepository } from '../repositories/customer.repository';
import { bookingRepository } from '../repositories/booking.repository';
import { successResponse } from '../utils/apiResponse';
import { AppError } from '../middleware/error.middleware';

export const customersController = {
  async list(req: Request, res: Response): Promise<void> {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string | undefined;
    const result = await customerRepository.findAll(req.merchantId!, page, limit, search);
    successResponse(res, result);
  },

  async detail(req: Request, res: Response): Promise<void> {
    const customer = await customerRepository.findById(req.merchantId!, req.params.id);
    if (!customer) throw new AppError('Customer not found', 404);

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const bookings = await bookingRepository.findByCustomer(
      req.merchantId!,
      req.params.id,
      page,
      limit,
    );
    successResponse(res, { customer, bookings });
  },
};
