import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useStorefrontStore = defineStore('storefront', () => {
  const merchantName = ref('')
  const logoUrl = ref<string | null>(null)

  function setMerchant(name: string, logo: string | null | undefined) {
    merchantName.value = name
    logoUrl.value = logo ?? null
  }

  return { merchantName, logoUrl, setMerchant }
})
