import { apiClient } from './client'
import type { ApiResponse, AvailabilityResponse, PromoValidateResponse, PublicBookingResponse, PublicCatalogResponse } from '@/types/api'

export const publicApi = {
  catalog: (slug: string) =>
    apiClient.get<ApiResponse<PublicCatalogResponse>>(`/public/${slug}/catalog`),

  availability: (slug: string, assetId: string, params: { start_time: string; end_time: string }) =>
    apiClient.get<ApiResponse<AvailabilityResponse>>(`/public/${slug}/assets/${assetId}/availability`, { params }),

  // Backend expects: { code, total_price } (not total_amount)
  validatePromo: (slug: string, data: { code: string; total_price: number }) =>
    apiClient.post<ApiResponse<PromoValidateResponse>>(`/public/${slug}/promos/validate`, data),

  createBooking: (
    slug: string,
    data: {
      asset_id: string
      start_time: string
      end_time: string
      customer_name: string
      customer_email: string
      customer_phone?: string
      promo_code?: string
    },
  ) => apiClient.post<ApiResponse<PublicBookingResponse>>(`/public/${slug}/bookings`, data),
}
