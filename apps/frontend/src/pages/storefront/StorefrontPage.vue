<template>
  <div>
    <AppSpinner v-if="loading" class="mx-auto" size="lg" />

    <AppAlert v-else-if="errorMsg" type="error" :message="errorMsg" />

    <div v-else-if="catalog">
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-gray-900">{{ catalog.merchant.name }}</h2>
        <p v-if="catalog.merchant.address" class="text-sm text-gray-500 mt-1">{{ catalog.merchant.address }}</p>
      </div>

      <AppEmptyState v-if="catalog.catalog.length === 0" title="No assets available" description="Check back later." />

      <template v-else>
        <!-- Search input -->
        <div class="relative mb-4">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
            </svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search assets..."
            class="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
        </div>

        <!-- No search results -->
        <AppEmptyState
          v-if="filteredCatalog.length === 0"
          title="No matching assets"
          :description="`No assets found for &quot;${searchQuery}&quot;`"
        />

        <!-- Catalog grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="asset in filteredCatalog"
            :key="asset.id"
            class="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            @click="goToCheckout(asset.id)"
          >
            <img
              v-if="asset.images?.[0]"
              :src="asset.images[0].url"
              :alt="asset.name"
              class="w-full h-40 object-cover"
            />
            <div
              v-else
              class="w-full h-40 bg-gray-100 flex items-center justify-center"
            >
              <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="px-4 pb-4 pt-3">
              <div class="flex items-start justify-between mb-2">
                <h3 class="font-semibold text-gray-900">{{ asset.name }}</h3>
                <span class="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{{ asset.type }}</span>
              </div>
              <p class="text-lg font-bold text-primary-600">
                {{ formatCurrency(asset.base_price) }}<span class="text-sm font-normal text-gray-500"> / {{ asset.price_unit }}</span>
              </p>
              <p class="text-xs text-gray-500 mt-2">
                {{ asset.available_units_count }} unit{{ asset.available_units_count !== 1 ? 's' : '' }} available
              </p>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { publicApi } from '@/api/public'
import { formatCurrency } from '@/utils/format'
import { useStorefrontStore } from '@/stores/storefront'
import type { PublicCatalogResponse } from '@/types/api'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'

const route = useRoute()
const router = useRouter()
const storefrontStore = useStorefrontStore()
const loading = ref(true)
const catalog = ref<PublicCatalogResponse | null>(null)
const errorMsg = ref('')
const searchQuery = ref('')

const filteredCatalog = computed(() => {
  if (!catalog.value) return []
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return catalog.value.catalog
  return catalog.value.catalog.filter((asset) =>
    asset.name.toLowerCase().includes(q) || asset.type.toLowerCase().includes(q),
  )
})

function goToCheckout(assetId: string) {
  router.push(`/store/${route.params.slug}/checkout?assetId=${assetId}`)
}

onMounted(async () => {
  try {
    const res = await publicApi.catalog(route.params.slug as string)
    catalog.value = res.data.data
    storefrontStore.setMerchant(res.data.data.merchant.name, res.data.data.merchant.logo_url)
  } catch (e) {
    const err = e as { response?: { data?: { error?: string } } }
    errorMsg.value = err.response?.data?.error ?? 'Failed to load catalog'
  } finally {
    loading.value = false
  }
})
</script>
