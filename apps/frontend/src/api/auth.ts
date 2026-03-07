import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'
import type { AuthLoginResponse } from '@/types/api'
import type { MerchantUser, Merchant } from '@/types/models'

export const authApi = {
  register: (data: { email: string; password: string; full_name: string }) =>
    apiClient.post<ApiResponse<null>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<ApiResponse<AuthLoginResponse>>('/auth/login', data),

  logout: () =>
    apiClient.post<ApiResponse<null>>('/auth/logout'),

  me: () =>
    apiClient.get<ApiResponse<{ user: MerchantUser; merchant: Merchant }>>('/auth/me'),

  verifyEmail: (token: string) =>
    apiClient.get<ApiResponse<null>>(`/auth/verify-email?token=${token}`),

  changePassword: (data: { current_password: string; new_password: string }) =>
    apiClient.put<ApiResponse<null>>('/auth/password', data),
}
