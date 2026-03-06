<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <RouterLink to="/dashboard/bookings" class="text-sm text-gray-500 hover:text-gray-700">← Bookings</RouterLink>
      <h1 class="text-2xl font-semibold text-gray-900">Booking #{{ booking?.id.slice(0, 8) }}</h1>
      <AppBadge v-if="booking" :status="booking.status" type="booking" />
    </div>

    <AppSpinner v-if="loading" class="mx-auto" size="lg" />

    <div v-else-if="booking" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left: Info -->
      <div class="space-y-4">
        <AppCard title="Booking Info">
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between"><dt class="text-gray-500">Start</dt><dd>{{ formatDateTime(booking.start_time) }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">End</dt><dd>{{ formatDateTime(booking.end_time) }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Asset</dt><dd>{{ booking.asset_name }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Unit</dt><dd>{{ booking.unit_identifier }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Discount</dt><dd>{{ formatCurrency(booking.discount_amount) }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Total</dt><dd class="font-semibold">{{ formatCurrency(booking.total_price) }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Upfront fee</dt><dd>{{ formatCurrency(booking.upfront_fee) }}</dd></div>
          </dl>
        </AppCard>

        <AppCard title="Customer Info">
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between"><dt class="text-gray-500">Name</dt><dd>{{ booking.customer_name }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Email</dt><dd>{{ booking.customer_email }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Phone</dt><dd>{{ booking.customer_phone ?? '—' }}</dd></div>
          </dl>
        </AppCard>
      </div>

      <!-- Right: Payment + Actions -->
      <div class="space-y-4">
        <AppCard title="Payment Status">
          <div class="flex items-center gap-2 mb-3">
            <AppBadge v-if="booking.payment_status" :status="booking.payment_status" type="payment" />
            <span v-else class="text-sm text-gray-500">No payment record</span>
          </div>
          <dl v-if="booking.payment_id" class="space-y-2 text-sm">
            <div class="flex justify-between"><dt class="text-gray-500">Amount</dt><dd>{{ formatCurrency(booking.payment_amount ?? 0) }}</dd></div>
            <div v-if="booking.payment_link" class="flex justify-between">
              <dt class="text-gray-500">Payment Link</dt>
              <dd><a :href="booking.payment_link" target="_blank" class="text-primary-600 hover:underline text-xs">Open</a></dd>
            </div>
          </dl>
        </AppCard>

        <AppCard title="Update Status">
          <div class="flex flex-wrap gap-2">
            <AppButton
              v-for="transition in availableTransitions"
              :key="transition.status"
              :variant="transition.variant"
              size="sm"
              :loading="updatingStatus === transition.status"
              @click="updateStatus(transition.status)"
            >
              {{ transition.label }}
            </AppButton>
            <p v-if="availableTransitions.length === 0" class="text-sm text-gray-500">No status transitions available.</p>
          </div>
          <AppAlert v-if="statusError" type="error" :message="statusError" class="mt-3" />
        </AppCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { bookingsApi } from '@/api/bookings'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { BookingStatus } from '@/types/enums'
import type { BookingDetailed } from '@/types/api'
import type { BookingStatus as BS } from '@/types/enums'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'

const route = useRoute()
const loading = ref(true)
const booking = ref<BookingDetailed | null>(null)
const updatingStatus = ref<BS | null>(null)
const statusError = ref('')

const transitionMap: Record<BS, { status: BS; label: string; variant: 'primary' | 'secondary' | 'danger' }[]> = {
  PENDING_PAYMENT: [
    { status: BookingStatus.CONFIRMED, label: 'Confirm', variant: 'primary' },
    { status: BookingStatus.CANCELLED, label: 'Cancel', variant: 'danger' },
  ],
  CONFIRMED: [
    { status: BookingStatus.ACTIVE, label: 'Mark Active', variant: 'primary' },
    { status: BookingStatus.CANCELLED, label: 'Cancel', variant: 'danger' },
  ],
  ACTIVE: [
    { status: BookingStatus.COMPLETED, label: 'Complete', variant: 'primary' },
    { status: BookingStatus.CANCELLED, label: 'Cancel', variant: 'danger' },
  ],
  COMPLETED: [],
  CANCELLED: [],
}

const availableTransitions = computed(() =>
  booking.value ? (transitionMap[booking.value.status] ?? []) : [],
)

async function updateStatus(status: BS) {
  if (!booking.value) return
  updatingStatus.value = status
  statusError.value = ''
  try {
    const res = await bookingsApi.updateStatus(booking.value.id, status)
    booking.value = res.data.data
  } catch (e) {
    const err = e as { response?: { data?: { error?: string } } }
    statusError.value = err.response?.data?.error ?? 'Failed to update status'
  } finally {
    updatingStatus.value = null
  }
}

onMounted(async () => {
  try {
    const res = await bookingsApi.get(route.params.id as string)
    booking.value = res.data.data
  } finally {
    loading.value = false
  }
})
</script>
