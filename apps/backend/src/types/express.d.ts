import type { MerchantUser } from './models';

declare global {
  namespace Express {
    interface Request {
      merchantId?: string;
      merchantUser?: Pick<MerchantUser, 'id' | 'merchant_id' | 'email' | 'full_name' | 'role'>;
      customerId?: string;
      customerMerchantId?: string;
    }
  }
}

export {};
