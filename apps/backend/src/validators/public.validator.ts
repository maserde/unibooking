import { z } from 'zod';

export const requestMagicLinkSchema = z.object({
  email: z.string().email(),
  merchant_id: z.string().uuid().optional(),
});
