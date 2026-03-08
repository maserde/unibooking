<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <RouterLink to="/dashboard/customers" class="text-sm text-gray-500 hover:text-gray-700">← Pelanggan</RouterLink>
      <h1 class="text-2xl font-semibold text-gray-900">{{ customer?.name }}</h1>
    </div>

    <AppSpinner v-if="loading" class="mx-auto" size="lg" />

    <div v-else-if="customer" class="space-y-6">
      <AppCard title="Info Pelanggan">
        <dl class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div><dt class="text-gray-500">Email</dt><dd class="font-medium">{{ customer.email }}</dd></div>
          <div><dt class="text-gray-500">Telepon</dt><dd class="font-medium">{{ customer.phone_number ?? '—' }}</dd></div>
          <div><dt class="text-gray-500">Bergabung</dt><dd class="font-medium">{{ formatDate(customer.created_at) }}</dd></div>
        </dl>
      </AppCard>

      <AppCard title="Riwayat Pemesanan" :no-padding="true">
        <AppTable :columns="columns" :rows="tableRows" :loading="false" clickable @row-click="goToBooking">
          <template #cell-status="{ row }">
            <AppBadge :status="String((row as Record<string, unknown>).status)" type="booking" />
          </template>
          <template #cell-start_time="{ row }">{{ formatDateTime(String((row as Record<string, unknown>).start_time)) }}</template>
          <template #cell-total_price="{ row }">{{ formatCurrency(Number((row as Record<string, unknown>).total_price)) }}</template>
          <template #empty>
            <AppEmptyState title="Tidak ada pemesanan" description="Pelanggan ini belum memiliki pemesanan." />
          </template>
        </AppTable>
      </AppCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { customersApi } from '@/api/customers'
import { formatDate, formatDateTime, formatCurrency } from '@/utils/format'
import type { Customer, Booking } from '@/types/models'
import AppCard from '@/components/ui/AppCard.vue'
import AppTable from '@/components/ui/AppTable.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const customer = ref<Customer | null>(null)
const bookings = ref<Booking[]>([])

const columns = [
  { key: 'shortId', label: 'ID' },
  { key: 'start_time', label: 'Mulai' },
  { key: 'status', label: 'Status' },
  { key: 'total_price', label: 'Total' },
]

const tableRows = computed(() =>
  bookings.value.map((b) => ({ ...b, shortId: b.id.slice(0, 8) })),
)

function goToBooking(row: Record<string, unknown>) {
  router.push(`/dashboard/bookings/${row.id}`)
}

onMounted(async () => {
  try {
    const res = await customersApi.get(route.params.id as string)
    customer.value = res.data.data.customer
    bookings.value = res.data.data.bookings.bookings
  } finally {
    loading.value = false
  }
})
</script>
