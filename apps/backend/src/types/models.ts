import type { MerchantUserRole, AssetType, PriceUnit, AssetUnitStatus, BookingStatus, PaymentStatus, PaymentType, DiscountType } from './enums';

export interface Merchant {
  id: string;
  name: string;
  slug: string;
  phone?: string | null;
  address?: string | null;
  logo_url?: string | null;
  mayar_api_key_encrypted?: string | null;
  mayar_webhook_status?: 'SUCCESS' | 'FAILED' | null;
  upfront_fee_percentage: number;
  created_at: Date;
  updated_at: Date;
}

export interface MerchantUser {
  id: string;
  merchant_id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: MerchantUserRole;
  is_email_verified: boolean;
  email_verification_token?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Customer {
  id: string;
  merchant_id: string;
  name: string;
  email: string;
  phone_number: string;
  created_at: Date;
  updated_at: Date;
}

export interface MagicLink {
  id: string;
  customer_id: string;
  token: string;
  expires_at: Date;
  is_used: boolean;
  created_at: Date;
}

export interface AssetImage {
  id: string;
  asset_id: string;
  s3_key: string;
  url: string;
  sort_order: number;
  created_at: Date;
}

export interface Asset {
  id: string;
  merchant_id: string;
  type: AssetType;
  name: string;
  base_price: number;
  price_unit: PriceUnit;
  attributes: Record<string, unknown> | null;
  images: AssetImage[];
  created_at: Date;
  updated_at: Date;
}

export interface AssetUnit {
  id: string;
  asset_id: string;
  identifier: string;
  status: AssetUnitStatus;
  created_at: Date;
  updated_at: Date;
}

export interface Booking {
  id: string;
  merchant_id: string;
  customer_id: string;
  asset_unit_id: string;
  promo_code_id?: string | null;
  start_time: Date;
  end_time: Date;
  total_price: number;
  upfront_fee: number;
  discount_amount: number;
  status: BookingStatus;
  created_at: Date;
  updated_at: Date;
}

export interface Payment {
  id: string;
  booking_id: string;
  mayar_transaction_id?: string | null;
  payment_link?: string | null;
  amount: number;
  status: PaymentStatus;
  payment_type: PaymentType;
  created_at: Date;
  updated_at: Date;
}

export interface PromoCode {
  id: string;
  merchant_id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_amount?: number | null;
  min_transaction_amount?: number | null;
  valid_from: Date;
  valid_until: Date;
  max_usage?: number | null;
  max_usage_per_customer?: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
