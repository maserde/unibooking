import { z } from 'zod';

export const createPromoSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  discount_type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discount_value: z.number().positive(),
  max_discount_amount: z.number().positive().optional().nullable(),
  min_transaction_amount: z.number().positive().optional().nullable(),
  valid_from: z.string().datetime(),
  valid_until: z.string().datetime(),
  max_usage: z.number().int().positive().optional().nullable(),
  max_usage_per_customer: z.number().int().positive().optional().nullable(),
  is_active: z.boolean().default(true),
});

export const updatePromoSchema = createPromoSchema.partial();

export const validatePromoSchema = z.object({
  code: z.string().min(1),
  total_price: z.number().positive(),
});
