import { apiClient } from './client'
import type { ApiResponse } from '@/types/api'
import type { Asset, AssetImage, AssetUnit } from '@/types/models'
import type { AssetType, PriceUnit, AssetUnitStatus } from '@/types/enums'

export const assetsApi = {
  list: () =>
    apiClient.get<ApiResponse<Asset[]>>('/merchant/assets'),

  create: (data: {
    type: AssetType
    name: string
    base_price: number
    price_unit: PriceUnit
    attributes?: Record<string, unknown>
  }) => apiClient.post<ApiResponse<Asset>>('/merchant/assets', data),

  update: (id: string, data: Partial<{ name: string; base_price: number; price_unit: PriceUnit; attributes: Record<string, unknown> }>) =>
    apiClient.put<ApiResponse<Asset>>(`/merchant/assets/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/merchant/assets/${id}`),

  listUnits: (assetId: string) =>
    apiClient.get<ApiResponse<AssetUnit[]>>(`/merchant/assets/${assetId}/units`),

  createUnit: (assetId: string, data: { identifier: string }) =>
    apiClient.post<ApiResponse<AssetUnit>>(`/merchant/assets/${assetId}/units`, data),

  // Backend route: PUT /merchant/units/:id  (assetId not needed in URL)
  updateUnit: (_assetId: string, unitId: string, data: { identifier?: string; status?: AssetUnitStatus }) =>
    apiClient.put<ApiResponse<AssetUnit>>(`/merchant/units/${unitId}`, data),

  // Backend route: DELETE /merchant/units/:id
  deleteUnit: (_assetId: string, unitId: string) =>
    apiClient.delete(`/merchant/units/${unitId}`),

  uploadImage: (assetId: string, file: File) => {
    const fd = new FormData()
    fd.append('image', file)
    return apiClient.post<ApiResponse<AssetImage>>(`/merchant/assets/${assetId}/images`, fd, {
      headers: { 'Content-Type': undefined },
    })
  },

  deleteImage: (assetId: string, imageId: string) =>
    apiClient.delete(`/merchant/assets/${assetId}/images/${imageId}`),

  // Backend expects: { asset: { type, name, base_price, price_unit, attributes }, units: [...] }
  initialSetup: (data: {
    type: AssetType
    name: string
    base_price: number
    price_unit: PriceUnit
    attributes?: Record<string, unknown>
    units: { identifier: string }[]
  }) => {
    const { units, ...assetData } = data
    return apiClient.post<ApiResponse<{ asset: Asset; units: AssetUnit[] }>>('/merchant/catalog/initial-setup', {
      asset: assetData,
      units,
    })
  },
}
