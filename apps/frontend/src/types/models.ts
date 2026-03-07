import type {
  MerchantUserRole,
  AssetType,
  PriceUnit,
  AssetUnitStatus,
  BookingStatus,
  PaymentStatus,
  DiscountType,
} from './enums'

export interface Merchant {
  id: string
  name: string
  slug: string
  phone?: string | null
  address?: string | null
  mayar_api_key_encrypted?: string | null
  mayar_webhook_status?: 'SUCCESS' | 'FAILED' | null
  upfront_fee_percentage: number
  storefront_url?: string
  created_at: string
  updated_at: string
}

export interface MerchantUser {
  id: string
  merchant_id: string
  email: string
  full_name: string
  role: MerchantUserRole
  is_email_verified: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  merchant_id: string
  name: string
  email: string
  phone_number?: string | null
  created_at: string
  updated_at: string
}

export interface Asset {
  id: string
  merchant_id: string
  type: AssetType
  name: string
  base_price: number
  price_unit: PriceUnit
  attributes: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface AssetUnit {
  id: string
  asset_id: string
  identifier: string
  status: AssetUnitStatus
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  merchant_id: string
  customer_id: string
  asset_unit_id: string
  promo_code_id?: string | null
  start_time: string
  end_time: string
  total_price: number
  upfront_fee: number
  discount_amount: number
  status: BookingStatus
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  booking_id: string
  mayar_transaction_id?: string | null
  payment_link?: string | null
  amount: number
  status: PaymentStatus
  created_at: string
  updated_at: string
}

export interface PromoCode {
  id: string
  merchant_id: string
  code: string
  discount_type: DiscountType
  discount_value: number
  max_discount_amount?: number | null
  min_transaction_amount?: number | null
  valid_from: string
  valid_until: string
  max_usage?: number | null
  max_usage_per_customer?: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}
