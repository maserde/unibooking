import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'
import type { Customer, Booking } from '@/types/models'

export const customersApi = {
  // Returns { customers: Customer[], total: number }
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get<ApiResponse<{ customers: Customer[]; total: number }>>('/merchant/customers', { params }),

  // Returns { customer: Customer, bookings: { bookings: Booking[], total: number } }
  get: (id: string) =>
    apiClient.get<ApiResponse<{ customer: Customer; bookings: { bookings: Booking[]; total: number } }>>(`/merchant/customers/${id}`),
}
