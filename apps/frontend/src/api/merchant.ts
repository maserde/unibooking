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

  uploadLogo: (file: File) => {
    const fd = new FormData()
    fd.append('logo', file)
    return apiClient.post<ApiResponse<Merchant>>('/merchant/logo', fd, {
      headers: { 'Content-Type': undefined },
    })
  },

  getWebhookInfo: () =>
    apiClient.get<ApiResponse<{ webhook_url: string; webhook_status: 'SUCCESS' | 'FAILED' | null; has_api_key: boolean }>>('/merchant/webhook'),

  retryWebhook: () =>
    apiClient.post<ApiResponse<{ webhook_status: 'SUCCESS' | 'FAILED' }>>('/merchant/webhook/retry'),

}
