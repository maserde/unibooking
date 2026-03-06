<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-semibold text-gray-900">Customers</h1>

    <AppCard :no-padding="true">
      <AppTable :columns="columns" :rows="tableRows" :loading="loading" clickable @row-click="goToDetail">
        <template #cell-created_at="{ row }">{{ formatDate(String((row as Record<string, unknown>).created_at)) }}</template>
        <template #cell-phone_number="{ row }">{{ (row as Record<string, unknown>).phone_number ?? '—' }}</template>
        <template #empty>
          <AppEmptyState title="No customers" description="Customers will appear here after their first booking." />
        </template>
      </AppTable>
      <AppPagination :page="page" :page-count="pageCount" :total="total" @update:page="changePage" />
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { customersApi } from '@/api/customers'
import { usePagination } from '@/composables/usePagination'
import { formatDate } from '@/utils/format'
import type { Customer } from '@/types/models'
import AppCard from '@/components/ui/AppCard.vue'
import AppTable from '@/components/ui/AppTable.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'

const router = useRouter()
const { page, total, pageCount, limit } = usePagination()
const loading = ref(false)
const rows = ref<Customer[]>([])

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone_number', label: 'Phone' },
  { key: 'created_at', label: 'Joined' },
]

const tableRows = computed(() => rows.value as unknown as Record<string, unknown>[])

async function fetchCustomers() {
  loading.value = true
  try {
    const res = await customersApi.list({ page: page.value, limit: limit.value })
    // Backend returns { customers, total }
    rows.value = res.data.data.customers
    total.value = res.data.data.total
  } finally {
    loading.value = false
  }
}

function changePage(p: number) { page.value = p }

function goToDetail(row: Record<string, unknown>) {
  router.push(`/dashboard/customers/${row.id}`)
}

watch(page, fetchCustomers)
onMounted(fetchCustomers)
</script>
