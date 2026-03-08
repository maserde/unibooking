<template>
  <div class="space-y-4">
    <h2 class="text-lg font-semibold text-gray-900">Customer Portal</h2>

    <div class="flex gap-2 flex-wrap">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        :class="[
          'px-3 py-1.5 text-sm rounded-md border transition-colors',
          activeStatus === tab.value
            ? 'bg-primary-600 text-white border-primary-600'
            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
        ]"
        @click="activeStatus = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <AppSpinner v-if="loading" class="mx-auto" size="lg" />

    <div v-else-if="filtered.length === 0">
      <AppEmptyState title="No bookings" description="You have no bookings yet." />
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="b in filtered"
        :key="b.id"
        class="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-sm transition-shadow"
        @click="router.push(`/customer/${slug}/bookings/${b.id}`)"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="font-medium text-lg text-gray-900">Booking #{{ b.id.slice(0, 8) }}</p>
            <p class="text-sm text-gray-500 mt-1">{{ formatDateTime(b.start_time) }} → {{ formatDateTime(b.end_time) }}</p>
          </div>
          <AppBadge :status="b.status" type="booking" />
        </div>
        <div class="mt-2 flex items-center justify-between">
          <span class="text-sm font-medium text-gray-900">{{ formatCurrency(b.total_price) }}</span>
          <span class="text-xs text-gray-500">Upfront: {{ formatCurrency(b.upfront_fee) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { customerPortalApi } from '@/api/customerPortal'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { BookingStatus } from '@/types/enums'
import type { Booking } from '@/types/models'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'

const route = useRoute()
const router = useRouter()
const slug = route.params.slug as string
const loading = ref(true)
const bookings = ref<Booking[]>([])
const activeStatus = ref('')

const statusTabs = [
  { value: '', label: 'All' },
  { value: BookingStatus.PENDING_PAYMENT, label: 'Pending' },
  { value: BookingStatus.CONFIRMED, label: 'Confirmed' },
  { value: BookingStatus.ACTIVE, label: 'Active' },
  { value: BookingStatus.COMPLETED, label: 'Completed' },
]

const filtered = computed(() =>
  activeStatus.value ? bookings.value.filter((b) => b.status === activeStatus.value) : bookings.value,
)

onMounted(async () => {
  try {
    const res = await customerPortalApi.myBookings()
    // Backend returns { bookings: [], total }
    bookings.value = res.data.data.bookings
  } finally {
    loading.value = false
  }
})
</script>
