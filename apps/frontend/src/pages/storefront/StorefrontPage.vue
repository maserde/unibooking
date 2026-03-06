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

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="asset in catalog.catalog"
          :key="asset.id"
          class="bg-white border border-gray-200 rounded-lg p-5 cursor-pointer hover:shadow-md transition-shadow"
          @click="goToCheckout(asset.id)"
        >
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { publicApi } from '@/api/public'
import { formatCurrency } from '@/utils/format'
import type { PublicCatalogResponse } from '@/types/api'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const catalog = ref<PublicCatalogResponse | null>(null)
const errorMsg = ref('')

function goToCheckout(assetId: string) {
  router.push(`/s/${route.params.slug}/checkout?assetId=${assetId}`)
}

onMounted(async () => {
  try {
    const res = await publicApi.catalog(route.params.slug as string)
    catalog.value = res.data.data
  } catch (e) {
    const err = e as { response?: { data?: { error?: string } } }
    errorMsg.value = err.response?.data?.error ?? 'Failed to load catalog'
  } finally {
    loading.value = false
  }
})
</script>
