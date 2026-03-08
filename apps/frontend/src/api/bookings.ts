import { apiClient } from './client'
import type { ApiResponse, BookingDetailed, BookingsListResponse } from '@/types/api'
import type { BookingStatus } from '@/types/enums'

export const bookingsApi = {
  // Returns { bookings: Booking[], total: number }
  list: (params?: { status?: BookingStatus; page?: number; limit?: number; search?: string }) =>
    apiClient.get<ApiResponse<BookingsListResponse>>('/merchant/bookings', { params }),

  get: (id: string) =>
    apiClient.get<ApiResponse<BookingDetailed>>(`/merchant/bookings/${id}`),

  updateStatus: (id: string, status: BookingStatus) =>
    apiClient.patch<ApiResponse<BookingDetailed>>(`/merchant/bookings/${id}/status`, { status }),

  chargeRemainder: (id: string) =>
    apiClient.post<ApiResponse<BookingDetailed>>(`/merchant/bookings/${id}/charge-remainder`),
}
