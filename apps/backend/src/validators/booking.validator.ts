import { z } from 'zod';

export const createBookingSchema = z.object({
  asset_id: z.string().uuid(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  customer_name: z.string().min(2).max(255),
  customer_email: z.string().email(),
  customer_phone: z.string().max(50).optional(),
  promo_code: z.string().optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED', 'CONFIRMED']),
});

export const availabilityQuerySchema = z.object({
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
});
