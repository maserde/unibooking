<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-semibold text-gray-900">Pemesanan</h1>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3">
      <div class="flex gap-1 flex-wrap">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          :class="[
            'px-3 py-1.5 text-sm rounded-md border transition-colors',
            activeStatus === tab.value
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
          ]"
          @click="setStatus(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>
      <input
        v-model="search"
        type="search"
        placeholder="Cari berdasarkan nama pelanggan atau ID…"
        class="ml-auto px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
      />
    </div>

    <AppCard :no-padding="true">
      <AppTable :columns="columns" :rows="tableRows" :loading="loading" clickable @row-click="goToDetail">
        <template #cell-status="{ row }">
          <AppBadge :status="String((row as Record<string, unknown>).status)" type="booking" />
        </template>
        <template #cell-start_time="{ row }">{{ formatDateTime(String((row as Record<string, unknown>).start_time)) }}</template>
        <template #cell-end_time="{ row }">{{ formatDateTime(String((row as Record<string, unknown>).end_time)) }}</template>
        <template #cell-total_price="{ row }">{{ formatCurrency(Number((row as Record<string, unknown>).total_price)) }}</template>
        <template #cell-upfront_fee="{ row }">{{ formatCurrency(Number((row as Record<string, unknown>).upfront_fee)) }}</template>
        <template #empty>
          <AppEmptyState title="Tidak ada pemesanan" description="Tidak ada pemesanan yang sesuai filter." />
        </template>
      </AppTable>
      <AppPagination :page="page" :page-count="pageCount" :total="total" @update:page="changePage" />
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { bookingsApi } from '@/api/bookings'
import { usePagination } from '@/composables/usePagination'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { BookingStatus } from '@/types/enums'
import type { Booking } from '@/types/models'
import { useDebounce } from '@vueuse/core'
import AppCard from '@/components/ui/AppCard.vue'
import AppTable from '@/components/ui/AppTable.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'

const router = useRouter()
const { page, limit, total, pageCount, reset } = usePagination(20)
const loading = ref(false)
const rows = ref<Booking[]>([])
const activeStatus = ref<string>('')
const search = ref('')
const debouncedSearch = useDebounce(search, 300)

const statusTabs = [
  { value: '', label: 'Semua' },
  { value: BookingStatus.PENDING_PAYMENT, label: 'Menunggu Pembayaran' },
  { value: BookingStatus.CONFIRMED, label: 'Dikonfirmasi' },
  { value: BookingStatus.ACTIVE, label: 'Aktif' },
  { value: BookingStatus.COMPLETED, label: 'Selesai' },
  { value: BookingStatus.CANCELLED, label: 'Dibatalkan' },
]

const columns = [
  { key: 'shortId', label: 'ID' },
  { key: 'customer_name', label: 'Pelanggan' },
  { key: 'start_time', label: 'Mulai' },
  { key: 'end_time', label: 'Selesai' },
  { key: 'status', label: 'Status' },
  { key: 'total_price', label: 'Total' },
  { key: 'upfront_fee', label: 'DP' },
]

const tableRows = computed(() =>
  rows.value.map((b) => ({
    ...b,
    shortId: b.id.slice(0, 8),
  })),
)

async function fetchBookings() {
  loading.value = true
  try {
    const res = await bookingsApi.list({
      status: activeStatus.value ? (activeStatus.value as (typeof BookingStatus)[keyof typeof BookingStatus]) : undefined,
      page: page.value,
      limit: limit.value,
      search: debouncedSearch.value || undefined,
    })
    // Backend returns { bookings, total }
    rows.value = res.data.data.bookings
    total.value = res.data.data.total
  } finally {
    loading.value = false
  }
}

function setStatus(s: string) {
  activeStatus.value = s
  reset()
}

watch(debouncedSearch, reset)

function changePage(p: number) {
  page.value = p
}

function goToDetail(row: Record<string, unknown>) {
  router.push(`/dashboard/bookings/${row.id}`)
}

watch([activeStatus, page, debouncedSearch], fetchBookings)
onMounted(fetchBookings)
</script>
