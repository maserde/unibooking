<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-gray-900">Kode Promo</h1>
      <AppButton @click="openModal()">+ Tambah Promo</AppButton>
    </div>

    <AppCard :no-padding="true">
      <AppTable :columns="columns" :rows="tableRows" :loading="loading">
        <template #cell-is_active="{ row }">
          <button
            :class="['relative inline-flex h-5 w-9 rounded-full transition-colors', (row as unknown as PromoCode).is_active ? 'bg-primary-600' : 'bg-gray-200']"
            @click="toggle(row as unknown as PromoCode)"
          >
            <span :class="['inline-block h-4 w-4 rounded-full bg-white shadow transform transition mt-0.5', (row as unknown as PromoCode).is_active ? 'translate-x-4' : 'translate-x-0.5']" />
          </button>
        </template>
        <template #cell-discount_value="{ row }">
          {{ (row as unknown as PromoCode).discount_type === 'PERCENTAGE' ? `${(row as unknown as PromoCode).discount_value}%` : formatCurrency((row as unknown as PromoCode).discount_value) }}
        </template>
        <template #cell-valid_until="{ row }">{{ formatDate((row as unknown as PromoCode).valid_until) }}</template>
        <template #cell-actions="{ row }">
          <div class="flex gap-2">
            <AppButton variant="secondary" size="sm" @click="openModal(row as unknown as PromoCode)">Edit</AppButton>
            <AppButton variant="danger" size="sm" @click="confirmDelete(row as unknown as PromoCode)">Hapus</AppButton>
          </div>
        </template>
        <template #empty>
          <AppEmptyState title="Tidak ada kode promo" description="Buat kode promo untuk memberikan diskon ke pelanggan." />
        </template>
      </AppTable>
    </AppCard>

    <PromoFormModal v-model="modalOpen" :promo="editingPromo" @saved="onSaved" />

    <AppConfirmDialog
      v-model="deleteDialogOpen"
      title="Hapus Kode Promo"
      :description="`Hapus promo '${deletingPromo?.code}'?`"
      confirm-label="Hapus"
      danger
      :loading="deleting"
      @confirm="doDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { promosApi } from '@/api/promos'
import { useToast } from '@/composables/useToast'
import { formatCurrency, formatDate } from '@/utils/format'
import type { PromoCode } from '@/types/models'
import AppCard from '@/components/ui/AppCard.vue'
import AppTable from '@/components/ui/AppTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import PromoFormModal from '@/components/PromoFormModal.vue'

const toast = useToast()
const loading = ref(false)
const promos = ref<PromoCode[]>([])
const modalOpen = ref(false)
const editingPromo = ref<PromoCode | null>(null)
const deleteDialogOpen = ref(false)
const deletingPromo = ref<PromoCode | null>(null)
const deleting = ref(false)

const columns = [
  { key: 'code', label: 'Kode' },
  { key: 'discount_type', label: 'Tipe' },
  { key: 'discount_value', label: 'Nilai' },
  { key: 'valid_until', label: 'Kedaluwarsa' },
  { key: 'max_usage', label: 'Maks Penggunaan' },
  { key: 'is_active', label: 'Aktif' },
  { key: 'actions', label: '' },
]

const tableRows = computed(() =>
  promos.value.map((p) => ({ ...p, max_usage: p.max_usage ?? '∞' })),
)

async function fetchPromos() {
  loading.value = true
  try {
    const res = await promosApi.list()
    promos.value = res.data.data
  } finally {
    loading.value = false
  }
}

function openModal(promo?: PromoCode) {
  editingPromo.value = promo ?? null
  modalOpen.value = true
}

function onSaved() {
  modalOpen.value = false
  fetchPromos()
}

async function toggle(promo: PromoCode) {
  try {
    await promosApi.toggle(promo.id, !promo.is_active)
    fetchPromos()
  } catch {
    toast.error('Gagal mengubah status promo')
  }
}

function confirmDelete(promo: PromoCode) {
  deletingPromo.value = promo
  deleteDialogOpen.value = true
}

async function doDelete() {
  if (!deletingPromo.value) return
  deleting.value = true
  try {
    await promosApi.delete(deletingPromo.value.id)
    toast.success('Promo dihapus')
    deleteDialogOpen.value = false
    fetchPromos()
  } catch {
    toast.error('Gagal menghapus promo')
  } finally {
    deleting.value = false
  }
}

onMounted(fetchPromos)
</script>
