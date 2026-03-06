import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { customerPortalApi } from '@/api/customerPortal'

export const useCustomerStore = defineStore('customer', () => {
  const token = useLocalStorage<string | null>('mb_customer_token', null)

  const isAuthenticated = computed(() => !!token.value)

  async function requestMagicLink(email: string, slug: string) {
    await customerPortalApi.requestMagicLink({ email, slug })
  }

  async function verifyToken(t: string) {
    // Backend only returns { token } — no customer object
    const res = await customerPortalApi.verifyToken(t)
    token.value = res.data.data.token
  }

  function logout() {
    token.value = null
  }

  return { token, isAuthenticated, requestMagicLink, verifyToken, logout }
})
