import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'
import type { PromoCode } from '@/types/models'
import type { DiscountType } from '@/types/enums'

export const promosApi = {
  list: () =>
    apiClient.get<ApiResponse<PromoCode[]>>('/merchant/promos'),

  create: (data: {
    code: string
    discount_type: DiscountType
    discount_value: number
    valid_from: string
    valid_until: string
    max_discount_amount?: number
    min_transaction_amount?: number
    max_usage?: number
    max_usage_per_customer?: number
  }) => apiClient.post<ApiResponse<PromoCode>>('/merchant/promos', data),

  update: (id: string, data: Partial<PromoCode>) =>
    apiClient.put<ApiResponse<PromoCode>>(`/merchant/promos/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/merchant/promos/${id}`),

  // No separate toggle endpoint — use update with { is_active }
  toggle: (id: string, is_active: boolean) =>
    apiClient.put<ApiResponse<PromoCode>>(`/merchant/promos/${id}`, { is_active }),
}
