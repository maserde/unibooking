<template>
  <div class="space-y-4">
    <RouterLink to="/customer/bookings" class="text-sm text-gray-500 hover:text-gray-700">← My Bookings</RouterLink>

    <AppSpinner v-if="loading" class="mx-auto" size="lg" />

    <div v-else-if="booking" class="space-y-4">
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-semibold text-gray-900">{{ booking.asset_name ?? 'Booking' }}</h2>
        <AppBadge :status="booking.status" type="booking" />
      </div>

      <AppCard title="Booking Details">
        <dl class="space-y-3 text-sm">
          <div class="flex justify-between"><dt class="text-gray-500">Start</dt><dd>{{ formatDateTime(booking.start_time) }}</dd></div>
          <div class="flex justify-between"><dt class="text-gray-500">End</dt><dd>{{ formatDateTime(booking.end_time) }}</dd></div>
          <div class="flex justify-between"><dt class="text-gray-500">Unit</dt><dd>{{ booking.unit_identifier ?? '—' }}</dd></div>
          <div class="flex justify-between"><dt class="text-gray-500">Discount</dt><dd>{{ formatCurrency(booking.discount_amount) }}</dd></div>
          <div class="flex justify-between font-semibold"><dt>Total</dt><dd>{{ formatCurrency(booking.total_price) }}</dd></div>
          <div class="flex justify-between"><dt class="text-gray-500">Upfront paid</dt><dd>{{ formatCurrency(booking.upfront_fee) }}</dd></div>
        </dl>
      </AppCard>

      <AppCard v-if="booking.payment_id" title="Payment">
        <div class="flex items-center gap-2">
          <AppBadge v-if="booking.payment_status" :status="booking.payment_status" type="payment" />
          <span class="text-sm text-gray-500">{{ formatCurrency(booking.payment_amount ?? 0) }}</span>
        </div>
        <div v-if="booking.status === 'PENDING_PAYMENT' && booking.payment_link" class="mt-4">
          <a
            :href="booking.payment_link"
            class="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
          >
            Pay Now
          </a>
        </div>
      </AppCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { customerPortalApi } from '@/api/customerPortal'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { BookingDetailed } from '@/types/api'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'

const route = useRoute()
const loading = ref(true)
const booking = ref<BookingDetailed | null>(null)

onMounted(async () => {
  try {
    const res = await customerPortalApi.getBooking(route.params.id as string)
    booking.value = res.data.data
  } finally {
    loading.value = false
  }
})
</script>
