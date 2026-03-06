import type { AxiosError } from 'axios'

export function useApiError() {
  function extractError(err: unknown): string {
    const axiosErr = err as AxiosError<{ error?: string; message?: string }>
    return (
      axiosErr.response?.data?.error ||
      axiosErr.response?.data?.message ||
      axiosErr.message ||
      'An unexpected error occurred'
    )
  }
  return { extractError }
}
