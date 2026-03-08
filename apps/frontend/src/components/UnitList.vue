<template>
  <div class="px-6 py-4">
    <div class="flex items-center justify-between mb-3">
      <p class="text-sm font-medium text-gray-700">Unit</p>
      <AppButton v-if="canEdit" variant="secondary" size="sm" @click="openUnitModal()">+ Tambah Unit</AppButton>
    </div>

    <AppSpinner v-if="loading" size="sm" />

    <div v-else-if="units.length === 0" class="text-sm text-gray-500">Belum ada unit ditambahkan.</div>

    <div v-else class="space-y-2">
      <div v-for="unit in units" :key="unit.id" class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-3">
          <span class="font-medium text-gray-900">{{ unit.identifier }}</span>
          <AppBadge :status="unit.status" type="unit" />
        </div>
        <div v-if="canEdit" class="flex gap-1">
          <AppButton variant="ghost" size="sm" @click="openUnitModal(unit)">Edit</AppButton>
          <AppButton variant="ghost" size="sm" @click="confirmDelete(unit)">✕</AppButton>
        </div>
      </div>
    </div>

    <UnitFormModal v-model="modalOpen" :asset-id="assetId" :unit="editingUnit" @saved="fetchUnits" />

    <AppConfirmDialog
      v-model="deleteDialogOpen"
      title="Hapus Unit"
      :description="`Hapus unit '${deletingUnit?.identifier}'?`"
      confirm-label="Hapus"
      danger
      :loading="deleting"
      @confirm="doDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { assetsApi } from '@/api/assets'
import { useToast } from '@/composables/useToast'
import type { AssetUnit } from '@/types/models'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import UnitFormModal from '@/components/UnitFormModal.vue'

const props = defineProps<{ assetId: string; canEdit: boolean }>()
const toast = useToast()

const loading = ref(true)
const units = ref<AssetUnit[]>([])
const modalOpen = ref(false)
const editingUnit = ref<AssetUnit | null>(null)
const deleteDialogOpen = ref(false)
const deletingUnit = ref<AssetUnit | null>(null)
const deleting = ref(false)

async function fetchUnits() {
  loading.value = true
  try {
    const res = await assetsApi.listUnits(props.assetId)
    units.value = res.data.data
  } finally {
    loading.value = false
  }
}

function openUnitModal(unit?: AssetUnit) {
  editingUnit.value = unit ?? null
  modalOpen.value = true
}

function confirmDelete(unit: AssetUnit) {
  deletingUnit.value = unit
  deleteDialogOpen.value = true
}

async function doDelete() {
  if (!deletingUnit.value) return
  deleting.value = true
  try {
    await assetsApi.deleteUnit(props.assetId, deletingUnit.value.id)
    toast.success('Unit dihapus')
    deleteDialogOpen.value = false
    fetchUnits()
  } catch {
    toast.error('Gagal menghapus unit')
  } finally {
    deleting.value = false
  }
}

onMounted(fetchUnits)
</script>
