import { apiClient } from './client'
import type { ApiResponse, DashboardStats } from '@/types/api'

export const dashboardApi = {
  stats: () => apiClient.get<ApiResponse<DashboardStats>>('/merchant/dashboard/stats'),
}
