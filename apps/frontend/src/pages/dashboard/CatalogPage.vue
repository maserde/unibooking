<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-gray-900">Catalog</h1>
      <AppButton v-if="authStore.can(['OWNER', 'ADMIN'])" @click="openAssetModal()">+ Add Asset</AppButton>
    </div>

    <AppSpinner v-if="loading" class="mx-auto" size="lg" />

    <div v-else-if="assets.length === 0">
      <AppEmptyState title="No assets" description="Create your first asset to get started." icon="📦">
        <template #action>
          <AppButton @click="openAssetModal()">Add Asset</AppButton>
        </template>
      </AppEmptyState>
    </div>

    <div v-else class="space-y-4">
      <AppCard v-for="asset in assets" :key="asset.id" :no-padding="true">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 class="font-semibold text-gray-900">{{ asset.name }}</h3>
            <p class="text-sm text-gray-500">{{ asset.type }} · {{ formatCurrency(asset.base_price) }} / {{ asset.price_unit }}</p>
          </div>
          <div v-if="authStore.can(['OWNER', 'ADMIN'])" class="flex gap-2">
            <AppButton variant="secondary" size="sm" @click="openAssetModal(asset)">Edit</AppButton>
            <AppButton variant="danger" size="sm" @click="confirmDelete(asset)">Delete</AppButton>
          </div>
        </div>

        <!-- Units -->
        <UnitList :asset-id="asset.id" :can-edit="authStore.can(['OWNER', 'ADMIN', 'STAFF'])" />
      </AppCard>
    </div>

    <!-- Asset Modal -->
    <AssetFormModal v-model="assetModalOpen" :asset="editingAsset" @saved="onAssetSaved" />

    <!-- Delete confirm -->
    <AppConfirmDialog
      v-model="deleteDialogOpen"
      title="Delete Asset"
      :description="`Are you sure you want to delete '${deletingAsset?.name}'? This cannot be undone.`"
      confirm-label="Delete"
      danger
      :loading="deleting"
      @confirm="doDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { assetsApi } from '@/api/assets'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/format'
import type { Asset } from '@/types/models'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import AssetFormModal from '@/components/AssetFormModal.vue'
import UnitList from '@/components/UnitList.vue'

const authStore = useAuthStore()
const toast = useToast()

const loading = ref(true)
const assets = ref<Asset[]>([])
const assetModalOpen = ref(false)
const editingAsset = ref<Asset | null>(null)
const deleteDialogOpen = ref(false)
const deletingAsset = ref<Asset | null>(null)
const deleting = ref(false)

async function fetchAssets() {
  loading.value = true
  try {
    const res = await assetsApi.list()
    assets.value = res.data.data
  } finally {
    loading.value = false
  }
}

function openAssetModal(asset?: Asset) {
  editingAsset.value = asset ?? null
  assetModalOpen.value = true
}

function onAssetSaved() {
  assetModalOpen.value = false
  fetchAssets()
}

function confirmDelete(asset: Asset) {
  deletingAsset.value = asset
  deleteDialogOpen.value = true
}

async function doDelete() {
  if (!deletingAsset.value) return
  deleting.value = true
  try {
    await assetsApi.delete(deletingAsset.value.id)
    toast.success('Asset deleted')
    deleteDialogOpen.value = false
    fetchAssets()
  } catch {
    toast.error('Failed to delete asset')
  } finally {
    deleting.value = false
  }
}

onMounted(fetchAssets)
</script>
