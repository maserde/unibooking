import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'
import type { MerchantUser } from '@/types/models'
import type { MerchantUserRole } from '@/types/enums'

export const staffApi = {
  list: () => apiClient.get<ApiResponse<MerchantUser[]>>('/merchant/staff'),

  invite: (data: { email: string; full_name: string; role: MerchantUserRole }) =>
    apiClient.post<ApiResponse<MerchantUser>>('/merchant/staff', data),

  update: (id: string, data: { role: MerchantUserRole }) =>
    apiClient.put<ApiResponse<MerchantUser>>(`/merchant/staff/${id}`, data),

  remove: (id: string) => apiClient.delete(`/merchant/staff/${id}`),
}
