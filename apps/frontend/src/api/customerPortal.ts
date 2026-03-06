import { customerApiClient } from './client'
import type { ApiResponse, BookingDetailed, CustomerBookingsResponse } from '@/types/api'

export const customerPortalApi = {
  // Backend expects: { email, merchant_slug }
  requestMagicLink: (data: { email: string; slug: string }) =>
    customerApiClient.post<ApiResponse<null>>('/customer/auth/request-magic-link', {
      email: data.email,
      merchant_slug: data.slug,
    }),

  // Backend response: { token } only — no customer object
  verifyToken: (token: string) =>
    customerApiClient.get<ApiResponse<{ token: string }>>(`/customer/auth/verify/${token}`),

  // Returns { bookings: Booking[], total: number }
  myBookings: (params?: { page?: number; limit?: number }) =>
    customerApiClient.get<ApiResponse<CustomerBookingsResponse>>('/customer/bookings', { params }),

  getBooking: (id: string) =>
    customerApiClient.get<ApiResponse<BookingDetailed>>(`/customer/bookings/${id}`),
}
