<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <h1 class="text-2xl font-semibold text-gray-900">Customers</h1>
      <input
        v-model="search"
        type="search"
        placeholder="Search by name, email or phone…"
        class="ml-auto px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-72"
      />
    </div>

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
import { useDebounce } from '@vueuse/core'
import AppCard from '@/components/ui/AppCard.vue'
import AppTable from '@/components/ui/AppTable.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'

const router = useRouter()
const { page, total, pageCount, limit, reset } = usePagination()
const loading = ref(false)
const rows = ref<Customer[]>([])
const search = ref('')
const debouncedSearch = useDebounce(search, 300)

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
    const res = await customersApi.list({ page: page.value, limit: limit.value, search: debouncedSearch.value || undefined })
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

watch(debouncedSearch, reset)
watch([page, debouncedSearch], fetchCustomers)
onMounted(fetchCustomers)
</script>
