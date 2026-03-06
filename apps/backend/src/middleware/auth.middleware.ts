import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type MerchantTokenPayload, type CustomerTokenPayload } from '../utils/jwt';
import { redis } from '../config/redis';
import { AppError } from './error.middleware';

function extractBearerToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

export async function authMerchant(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req);
  if (!token) throw new AppError('Authentication required', 401);

  const payload = verifyToken(token) as MerchantTokenPayload;
  if (payload.type !== 'merchant') throw new AppError('Invalid token type', 401);

  // Check JTI blacklist
  const blacklisted = await redis.get(`blacklist:${payload.jti}`);
  if (blacklisted) throw new AppError('Token has been revoked', 401);

  req.merchantUser = {
    id: payload.sub,
    merchant_id: payload.merchantId,
    email: '',
    full_name: '',
    role: payload.role,
  };
  req.merchantId = payload.merchantId;
  next();
}

export async function authCustomer(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req);
  if (!token) throw new AppError('Authentication required', 401);

  const payload = verifyToken(token) as CustomerTokenPayload;
  if (payload.type !== 'customer') throw new AppError('Invalid token type', 401);

  const blacklisted = await redis.get(`blacklist:${payload.jti}`);
  if (blacklisted) throw new AppError('Token has been revoked', 401);

  req.customerId = payload.sub;
  req.customerMerchantId = payload.merchantId;
  next();
}
