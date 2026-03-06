import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { generateUuid } from './uuid';
import type { MerchantUserRole } from '../types/enums';

export interface MerchantTokenPayload {
  sub: string; // merchantUserId
  merchantId: string;
  role: MerchantUserRole;
  jti: string;
  type: 'merchant';
}

export interface CustomerTokenPayload {
  sub: string; // customerId
  merchantId: string;
  jti: string;
  type: 'customer';
}

export function signMerchantToken(payload: Omit<MerchantTokenPayload, 'jti' | 'type'>): string {
  return jwt.sign(
    { ...payload, jti: generateUuid(), type: 'merchant' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions,
  );
}

export function signCustomerToken(payload: Omit<CustomerTokenPayload, 'jti' | 'type'>): string {
  return jwt.sign(
    { ...payload, jti: generateUuid(), type: 'customer' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_CUSTOMER_EXPIRES_IN } as jwt.SignOptions,
  );
}

export function verifyToken(token: string): MerchantTokenPayload | CustomerTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as MerchantTokenPayload | CustomerTokenPayload;
}

export function decodeTokenExpiry(token: string): number {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  return decoded?.exp ?? 0;
}
