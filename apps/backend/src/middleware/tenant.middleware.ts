import type { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

/**
 * Ensures merchantId is present on req (set by authMerchant).
 * Use after authMerchant middleware.
 */
export function requireTenant(req: Request, _res: Response, next: NextFunction): void {
  if (!req.merchantId) throw new AppError('Tenant context missing', 401);
  next();
}
