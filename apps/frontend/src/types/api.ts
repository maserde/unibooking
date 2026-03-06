import type { Booking, Asset, AssetUnit, Merchant } from './models'
import type { BookingStatus } from './enums'

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// Flat detailed booking from findDetailedById JOIN query
export interface BookingDetailed extends Booking {
  customer_name: string
  customer_email: string
  customer_phone?: string | null
  unit_identifier: string
  unit_status: string
  asset_name: string
  asset_type: string
  price_unit: string
  payment_id?: string | null
  payment_link?: string | null
  payment_amount?: number | null
  payment_status?: string | null
  mayar_transaction_id?: string | null
}

// Flat recent booking from dashboard service JOIN query
export interface DashboardRecentBooking {
  id: string
  status: BookingStatus
  total_price: number
  start_time: string
  end_time: string
  created_at: string
  customer_name: string
  customer_email: string
  asset_name: string
}

// Dashboard stats response — field names match backend exactly
export interface DashboardStats {
  active_bookings: number
  today_revenue: number
  units_currently_rented: number
  total_customers: number
  pending_payments: number
  recent_bookings: DashboardRecentBooking[]
}

// Bookings list: backend returns { bookings, total }
export interface BookingsListResponse {
  bookings: Booking[]
  total: number
}

export interface AvailabilityResponse {
  available: boolean
  available_units: AssetUnit[]
}

// validatePromo: backend returns { discount_amount, discount_type, discount_value }
export interface PromoValidateResponse {
  discount_amount: number
  discount_type: string
  discount_value: number
}

export interface PublicBookingResponse {
  booking: {
    id: string
    status: string
    total_price: number
    upfront_fee: number
    discount_amount: number
    start_time: string
    end_time: string
  }
  payment_link: string
}

export interface PublicAsset extends Asset {
  available_units_count: number
}

// Backend getCatalog returns { merchant, catalog } (key is 'catalog', not 'assets')
export interface PublicCatalogResponse {
  merchant: Pick<Merchant, 'id' | 'name' | 'slug' | 'phone' | 'address'> & { upfront_fee_percentage?: number }
  catalog: PublicAsset[]
}

// Customer portal bookings: backend returns { bookings, total }
export interface CustomerBookingsResponse {
  bookings: Booking[]
  total: number
}

export interface AuthLoginResponse {
  token: string
  user: {
    id: string
    email: string
    full_name: string
    role: string
    merchant_id: string
  }
  // merchant NOT returned by login — fetched separately via /auth/me
}
