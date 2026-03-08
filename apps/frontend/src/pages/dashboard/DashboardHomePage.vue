<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold text-gray-900">Dasbor</h1>

    <!-- Stat cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      <AppCard v-for="stat in stats" :key="stat.label">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ stat.label }}</p>
        <p class="mt-1 text-2xl font-semibold text-gray-900">
          <AppSpinner v-if="loading" size="sm" color="text-gray-400" />
          <template v-else>{{ stat.value }}</template>
        </p>
      </AppCard>
    </div>

    <!-- Recent bookings -->
    <AppCard title="Pemesanan Terbaru" :no-padding="true">
      <AppTable :columns="columns" :rows="tableRows" :loading="loading" clickable @row-click="goToBooking">
        <template #cell-status="{ row }">
          <AppBadge :status="String((row as unknown as DashboardRecentBooking).status)" type="booking" />
        </template>
        <template #cell-total_price="{ row }">
          {{ formatCurrency((row as unknown as DashboardRecentBooking).total_price) }}
        </template>
        <template #cell-start_time="{ row }">
          {{ formatDateTime((row as unknown as DashboardRecentBooking).start_time) }}
        </template>
        <template #empty>
          <AppEmptyState title="Belum ada pemesanan" description="Pemesanan akan muncul di sini setelah pelanggan mulai memesan." />
        </template>
      </AppTable>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { dashboardApi } from '@/api/dashboard'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { DashboardStats, DashboardRecentBooking } from '@/types/api'
import AppCard from '@/components/ui/AppCard.vue'
import AppTable from '@/components/ui/AppTable.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'

const router = useRouter()
const loading = ref(true)
const data = ref<DashboardStats | null>(null)

const stats = computed(() => [
  { label: 'Pemesanan Aktif', value: data.value?.active_bookings ?? '—' },
  { label: 'Pendapatan Hari Ini', value: data.value ? formatCurrency(data.value.today_revenue) : '—' },
  { label: 'Unit Disewa', value: data.value?.units_currently_rented ?? '—' },
  { label: 'Total Pelanggan', value: data.value?.total_customers ?? '—' },
  { label: 'Pembayaran Tertunda', value: data.value?.pending_payments ?? '—' },
])

const columns = [
  { key: 'shortId', label: 'ID' },
  { key: 'customer_name', label: 'Pelanggan' },
  { key: 'asset_name', label: 'Aset' },
  { key: 'start_time', label: 'Mulai' },
  { key: 'status', label: 'Status' },
  { key: 'total_price', label: 'Total' },
]

const tableRows = computed(() =>
  (data.value?.recent_bookings ?? []).map((b) => ({
    ...b,
    shortId: b.id.slice(0, 8),
  })),
)

function goToBooking(row: Record<string, unknown>) {
  router.push(`/dashboard/bookings/${row.id}`)
}

onMounted(async () => {
  try {
    const res = await dashboardApi.stats()
    data.value = res.data.data
  } finally {
    loading.value = false
  }
})
</script>
