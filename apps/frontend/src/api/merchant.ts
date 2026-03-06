import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'
import type { Merchant } from '@/types/models'

export const merchantApi = {
  getProfile: () => apiClient.get<ApiResponse<Merchant>>('/merchant/profile'),

  updateProfile: (data: Partial<Pick<Merchant, 'name' | 'phone' | 'address' | 'upfront_fee_percentage'>>) =>
    apiClient.put<ApiResponse<Merchant>>('/merchant/profile', data),

  setupPayment: (data: { mayar_api_key: string }) =>
    apiClient.put<ApiResponse<{ message: string }>>('/merchant/payment-setup', {
      api_key: data.mayar_api_key,
    }),
}
