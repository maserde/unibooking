import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { authApi } from '@/api/auth'
import type { MerchantUser, Merchant } from '@/types/models'
import type { MerchantUserRole } from '@/types/enums'

export const useAuthStore = defineStore('auth', () => {
  const token = useLocalStorage<string | null>('mb_token', null)
  const user = ref<MerchantUser | null>(null)
  const merchant = ref<Merchant | null>(null)
  let fetchMePromise: Promise<void> | null = null

  const isAuthenticated = computed(() => !!token.value)

  const needsOnboarding = computed(() => {
    if (!merchant.value) return false
    const m = merchant.value
    return !m.phone || !m.address || !m.mayar_api_key_encrypted
  })

  function can(roles: MerchantUserRole[]): boolean {
    if (!user.value) return false
    return roles.includes(user.value.role)
  }

  async function fetchMe() {
    if (!token.value) return
    // Deduplicate concurrent calls
    if (fetchMePromise) return fetchMePromise
    fetchMePromise = (async () => {
      try {
        const res = await authApi.me()
        user.value = res.data.data.user
        merchant.value = res.data.data.merchant
      } catch {
        token.value = null
      } finally {
        fetchMePromise = null
      }
    })()
    return fetchMePromise
  }

  async function login(email: string, password: string) {
    const res = await authApi.login({ email, password })
    // Login only returns { token, user } — merchant is fetched via fetchMe() in router guard
    token.value = res.data.data.token
    user.value = res.data.data.user as MerchantUser
    merchant.value = null
  }

  async function register(data: { email: string; password: string; full_name: string }) {
    await authApi.register(data)
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      token.value = null
      user.value = null
      merchant.value = null
    }
  }

  function setMerchant(m: Merchant) {
    merchant.value = m
  }

  return { token, user, merchant, isAuthenticated, needsOnboarding, can, fetchMe, login, register, logout, setMerchant }
})
