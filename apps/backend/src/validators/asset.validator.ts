import { z } from 'zod';

export const createAssetSchema = z.object({
  type: z.enum(['ROOM', 'PHYSICAL_ITEM']),
  name: z.string().min(1).max(255),
  base_price: z.number().positive(),
  price_unit: z.enum(['HOUR', 'DAY']),
  attributes: z.record(z.unknown()).optional().nullable(),
});

export const updateAssetSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  base_price: z.number().positive().optional(),
  price_unit: z.enum(['HOUR', 'DAY']).optional(),
  attributes: z.record(z.unknown()).optional().nullable(),
});

export const createUnitSchema = z.object({
  identifier: z.string().min(1).max(100),
});

export const updateUnitSchema = z.object({
  identifier: z.string().min(1).max(100).optional(),
  status: z.enum(['AVAILABLE', 'MAINTENANCE', 'BROKEN']).optional(),
});

export const initialCatalogSchema = z.object({
  asset: createAssetSchema,
  units: z.array(z.object({ identifier: z.string().min(1).max(100) })).min(1),
});
