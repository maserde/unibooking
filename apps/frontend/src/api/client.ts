import axios from 'axios'

export const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export const customerApiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Interceptors are attached in main.ts after stores are initialized
// to avoid circular dependency (stores import apiClient, apiClient needs stores)
export function setupApiInterceptors(
  getToken: () => string | null,
  onUnauthorized: () => void,
  getCustomerToken: () => string | null,
  onCustomerUnauthorized: () => void,
) {
  apiClient.interceptors.request.use((config) => {
    const token = getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  apiClient.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) onUnauthorized()
      return Promise.reject(err)
    },
  )

  customerApiClient.interceptors.request.use((config) => {
    const token = getCustomerToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  customerApiClient.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) onCustomerUnauthorized()
      return Promise.reject(err)
    },
  )
}
