<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <RouterLink to="/dashboard/bookings" class="text-sm text-gray-500 hover:text-gray-700">← Pemesanan</RouterLink>
      <h1 class="text-2xl font-semibold text-gray-900">Pemesanan #{{ booking?.id.slice(0, 8) }}</h1>
      <AppBadge v-if="booking" :status="booking.status" type="booking" />
    </div>

    <AppSpinner v-if="loading" class="mx-auto" size="lg" />

    <div v-else-if="booking" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left: Info -->
      <div class="space-y-4">
        <AppCard title="Info Pemesanan">
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between"><dt class="text-gray-500">Mulai</dt><dd>{{ formatDateTime(booking.start_time) }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Selesai</dt><dd>{{ formatDateTime(booking.end_time) }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Aset</dt><dd>{{ booking.asset_name }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Unit</dt><dd>{{ booking.unit_identifier }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Diskon</dt><dd>{{ formatCurrency(booking.discount_amount) }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Total</dt><dd class="font-semibold">{{ formatCurrency(booking.total_price) }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Biaya DP</dt><dd>{{ formatCurrency(booking.upfront_fee) }}</dd></div>
          </dl>
        </AppCard>

        <AppCard title="Info Pelanggan">
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between"><dt class="text-gray-500">Nama</dt><dd>{{ booking.customer_name }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Email</dt><dd>{{ booking.customer_email }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Telepon</dt><dd>{{ booking.customer_phone ?? '—' }}</dd></div>
          </dl>
        </AppCard>
      </div>

      <!-- Right: Payment + Actions -->
      <div class="space-y-4">
        <AppCard title="Pembayaran DP">
          <div class="flex items-center gap-2 mb-3">
            <AppBadge v-if="booking.payment_status" :status="booking.payment_status" type="payment" />
            <span v-else class="text-sm text-gray-500">Tidak ada catatan pembayaran</span>
          </div>
          <dl v-if="booking.payment_id" class="space-y-2 text-sm">
            <div class="flex justify-between"><dt class="text-gray-500">Jumlah</dt><dd>{{ formatCurrency(booking.payment_amount ?? 0) }}</dd></div>
            <div v-if="booking.payment_link" class="flex justify-between">
              <dt class="text-gray-500">Tautan Pembayaran</dt>
              <dd><a :href="booking.payment_link" target="_blank" class="text-primary-600 hover:underline text-xs">Buka</a></dd>
            </div>
          </dl>
        </AppCard>

        <!-- Remainder Payment -->
        <AppCard title="Sisa Saldo">
          <template v-if="booking.remainder_payment_id">
            <div class="flex items-center gap-2 mb-3">
              <AppBadge :status="booking.remainder_payment_status ?? 'UNPAID'" type="payment" />
            </div>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between"><dt class="text-gray-500">Jumlah</dt><dd>{{ formatCurrency(booking.remainder_payment_amount ?? 0) }}</dd></div>
              <div v-if="booking.remainder_payment_link" class="flex justify-between">
                <dt class="text-gray-500">Tautan Pembayaran</dt>
                <dd><a :href="booking.remainder_payment_link" target="_blank" class="text-primary-600 hover:underline text-xs">Buka</a></dd>
              </div>
            </dl>
          </template>
          <template v-else-if="canChargeRemainder">
            <p class="text-sm text-gray-500 mb-3">
              Sisa: <span class="font-semibold text-gray-900">{{ formatCurrency(remainderAmount) }}</span>
            </p>
            <div v-if="cooldownRemaining > 0" class="flex items-center gap-2 mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Tunggu <strong>{{ cooldownRemaining }} detik</strong> sebelum membuat tautan pembayaran.</span>
            </div>
            <AppButton size="sm" :loading="chargingRemainder" :disabled="cooldownRemaining > 0" @click="chargeRemainder">
              Buat Pembayaran Sisa
            </AppButton>
            <AppAlert v-if="remainderError" type="error" :message="remainderError" class="mt-3" />
          </template>
          <template v-else>
            <p class="text-sm text-gray-500">
              {{ booking.upfront_fee >= booking.total_price ? 'Pembayaran penuh sudah dibayar di awal.' : 'Tersedia setelah pemesanan Aktif.' }}
            </p>
          </template>
        </AppCard>

        <AppCard title="Perbarui Status">
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
            <p v-if="availableTransitions.length === 0" class="text-sm text-gray-500">Tidak ada perubahan status tersedia.</p>
          </div>
          <AppAlert v-if="statusError" type="error" :message="statusError" class="mt-3" />
        </AppCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
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

const COOLDOWN_MS = 60_000

const route = useRoute()
const loading = ref(true)
const booking = ref<BookingDetailed | null>(null)
const updatingStatus = ref<BS | null>(null)
const statusError = ref('')
const chargingRemainder = ref(false)
const remainderError = ref('')
const cooldownRemaining = ref(0)

let cooldownTimer: ReturnType<typeof setInterval> | null = null

function cooldownKey(id: string) {
  return `remainder_cooldown_until_${id}`
}

function startCooldown(bookingId: string) {
  const until = Date.now() + COOLDOWN_MS
  localStorage.setItem(cooldownKey(bookingId), String(until))
  tickCooldown(until)
}

function tickCooldown(until: number) {
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownRemaining.value = Math.max(0, Math.ceil((until - Date.now()) / 1000))
  if (cooldownRemaining.value <= 0) return
  cooldownTimer = setInterval(() => {
    const remaining = Math.ceil((until - Date.now()) / 1000)
    if (remaining <= 0) {
      cooldownRemaining.value = 0
      clearInterval(cooldownTimer!)
      cooldownTimer = null
    } else {
      cooldownRemaining.value = remaining
    }
  }, 500)
}

function restoreCooldown(bookingId: string) {
  const stored = localStorage.getItem(cooldownKey(bookingId))
  if (!stored) return
  const until = Number(stored)
  if (Date.now() >= until) {
    localStorage.removeItem(cooldownKey(bookingId))
    return
  }
  tickCooldown(until)
}

const remainderAmount = computed(() =>
  booking.value ? Math.max(0, booking.value.total_price - booking.value.upfront_fee) : 0,
)

const canChargeRemainder = computed(() =>
  !!booking.value &&
  booking.value.status === 'ACTIVE' &&
  remainderAmount.value > 0 &&
  !booking.value.remainder_payment_id,
)

const transitionMap: Record<BS, { status: BS; label: string; variant: 'primary' | 'secondary' | 'danger' }[]> = {
  PENDING_PAYMENT: [
    { status: BookingStatus.CONFIRMED, label: 'Konfirmasi', variant: 'primary' },
    { status: BookingStatus.CANCELLED, label: 'Batalkan', variant: 'danger' },
  ],
  CONFIRMED: [
    { status: BookingStatus.ACTIVE, label: 'Tandai Aktif', variant: 'primary' },
    { status: BookingStatus.CANCELLED, label: 'Batalkan', variant: 'danger' },
  ],
  ACTIVE: [
    { status: BookingStatus.COMPLETED, label: 'Selesaikan', variant: 'primary' },
    { status: BookingStatus.CANCELLED, label: 'Batalkan', variant: 'danger' },
  ],
  COMPLETED: [],
  CANCELLED: [],
}

const availableTransitions = computed(() =>
  booking.value ? (transitionMap[booking.value.status] ?? []) : [],
)

async function chargeRemainder() {
  if (!booking.value) return
  chargingRemainder.value = true
  remainderError.value = ''
  try {
    const res = await bookingsApi.chargeRemainder(booking.value.id)
    booking.value = res.data.data
  } catch (e) {
    const err = e as { response?: { data?: { error?: string } } }
    remainderError.value = err.response?.data?.error ?? 'Gagal membuat pembayaran sisa'
  } finally {
    chargingRemainder.value = false
  }
}

async function updateStatus(status: BS) {
  if (!booking.value) return
  updatingStatus.value = status
  statusError.value = ''
  try {
    const res = await bookingsApi.updateStatus(booking.value.id, status)
    booking.value = res.data.data
    if (status === BookingStatus.ACTIVE) {
      startCooldown(booking.value.id)
    }
  } catch (e) {
    const err = e as { response?: { data?: { error?: string } } }
    statusError.value = err.response?.data?.error ?? 'Gagal memperbarui status'
  } finally {
    updatingStatus.value = null
  }
}

onMounted(async () => {
  try {
    const res = await bookingsApi.get(route.params.id as string)
    booking.value = res.data.data
    if (booking.value) restoreCooldown(booking.value.id)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})
</script>