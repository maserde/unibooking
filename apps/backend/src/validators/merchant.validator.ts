import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only')
    .optional(),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(1000).optional().nullable(),
  upfront_fee_percentage: z.number().min(0).max(100).optional(),
});

export const paymentSetupSchema = z.object({
  api_key: z.string().min(10),
});

export const inviteStaffSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2).max(255),
  role: z.enum(['ADMIN', 'STAFF']),
  password: z.string().min(8),
});

export const updateStaffSchema = z.object({
  full_name: z.string().min(2).max(255).optional(),
  role: z.enum(['ADMIN', 'STAFF']).optional(),
});
