import type { Request, Response, NextFunction } from 'express';
import type { MerchantUserRole } from '../types/enums';
import { AppError } from './error.middleware';

export function requireRole(...roles: MerchantUserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.merchantUser) throw new AppError('Authentication required', 401);
    if (!roles.includes(req.merchantUser.role)) {
      throw new AppError('Insufficient permissions', 403);
    }
    next();
  };
}
