<template>
  <AppModal :model-value="modelValue" :title="asset ? 'Edit Asset' : 'Add Asset'" size="md" @update:model-value="emit('update:modelValue', $event)">
    <AppAlert v-if="error" type="error" :message="error" class="mb-4" />
    <form class="space-y-4" @submit.prevent="save">
      <AppSelect v-model="form.type" label="Type" :options="typeOptions" :error="errors.type" />
      <AppInput v-model="form.name" label="Name" :error="errors.name" />
      <AppInput v-model="form.base_price" label="Base price (IDR)" type="number" :error="errors.base_price" />
      <AppSelect v-model="form.price_unit" label="Price unit" :options="unitOptions" />

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Attributes (optional)</label>
        <div v-for="(_attr, i) in attributes" :key="i" class="flex gap-2 mb-2">
          <AppInput v-model="attributes[i].key" placeholder="Key" class="flex-1" />
          <AppInput v-model="attributes[i].value" placeholder="Value" class="flex-1" />
          <AppButton variant="ghost" size="sm" type="button" @click="attributes.splice(i, 1)">✕</AppButton>
        </div>
        <AppButton variant="secondary" size="sm" type="button" @click="attributes.push({ key: '', value: '' })">
          + Add attribute
        </AppButton>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Photos (up to 3)</label>
        <div class="flex flex-wrap gap-3">
          <!-- Existing images -->
          <div v-for="img in existingImages" :key="img.id" class="relative w-24 h-24">
            <img :src="img.url" class="w-full h-full object-cover rounded-lg border border-gray-200" />
            <button
              type="button"
              class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
              @click="removeExistingImage(img)"
            >✕</button>
          </div>
          <!-- Pending preview images -->
          <div v-for="(url, i) in previewUrls" :key="`pending-${i}`" class="relative w-24 h-24">
            <img :src="url" class="w-full h-full object-cover rounded-lg border border-gray-200 border-dashed" />
            <button
              type="button"
              class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-gray-600"
              @click="removePendingFile(i)"
            >✕</button>
          </div>
          <!-- Add photo button -->
          <button
            v-if="existingImages.length + pendingFiles.length < 3"
            type="button"
            class="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
            @click="imageInput?.click()"
          >
            <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="text-xs">Add photo</span>
          </button>
        </div>
        <input ref="imageInput" type="file" accept="image/*" class="hidden" @change="onFileSelect" />
      </div>
    </form>
    <template #footer>
      <div class="flex justify-end gap-3">
        <AppButton variant="secondary" @click="emit('update:modelValue', false)">Cancel</AppButton>
        <AppButton :loading="saving" @click="save">{{ asset ? 'Save changes' : 'Create asset' }}</AppButton>
      </div>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { assetsApi } from '@/api/assets'
import { useApiError } from '@/composables/useApiError'
import { useToast } from '@/composables/useToast'
import type { Asset, AssetImage } from '@/types/models'
import type { AssetType, PriceUnit } from '@/types/enums'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'

const props = defineProps<{ modelValue: boolean; asset?: Asset | null }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean]; saved: [] }>()
const { extractError } = useApiError()
const toast = useToast()

const typeOptions = [{ value: 'ROOM', label: 'Room' }, { value: 'PHYSICAL_ITEM', label: 'Physical Item' }]
const unitOptions = [{ value: 'HOUR', label: 'Per hour' }, { value: 'DAY', label: 'Per day' }]

const form = reactive({ type: 'ROOM' as AssetType, name: '', base_price: '', price_unit: 'HOUR' as PriceUnit })
const errors = reactive({ type: '', name: '', base_price: '' })
const attributes = ref<{ key: string; value: string }[]>([])
const saving = ref(false)
const error = ref('')

const existingImages = ref<AssetImage[]>([])
const pendingFiles = ref<File[]>([])
const previewUrls = ref<string[]>([])
const imageInput = ref<HTMLInputElement | null>(null)

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.type = props.asset?.type ?? 'ROOM'
      form.name = props.asset?.name ?? ''
      form.base_price = String(props.asset?.base_price ?? '')
      form.price_unit = props.asset?.price_unit ?? 'HOUR'
      const attrs = props.asset?.attributes as Record<string, string> | null
      attributes.value = attrs ? Object.entries(attrs).map(([key, value]) => ({ key, value })) : []
      error.value = ''
      existingImages.value = props.asset?.images ?? []
      previewUrls.value.forEach((url) => URL.revokeObjectURL(url))
      previewUrls.value = []
      pendingFiles.value = []
    } else {
      previewUrls.value.forEach((url) => URL.revokeObjectURL(url))
      previewUrls.value = []
      pendingFiles.value = []
    }
  },
)

function onFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  pendingFiles.value.push(file)
  previewUrls.value.push(URL.createObjectURL(file))
  ;(e.target as HTMLInputElement).value = ''
}

async function removeExistingImage(img: AssetImage) {
  if (!props.asset) return
  try {
    await assetsApi.deleteImage(props.asset.id, img.id)
    existingImages.value = existingImages.value.filter((i) => i.id !== img.id)
  } catch (e) {
    error.value = extractError(e)
  }
}

function removePendingFile(index: number) {
  URL.revokeObjectURL(previewUrls.value[index])
  previewUrls.value.splice(index, 1)
  pendingFiles.value.splice(index, 1)
}

async function save() {
  errors.name = ''
  errors.base_price = ''
  if (!form.name) { errors.name = 'Required'; return }
  if (!form.base_price) { errors.base_price = 'Required'; return }

  const attrsObj = Object.fromEntries(attributes.value.filter((a) => a.key).map((a) => [a.key, a.value]))

  saving.value = true
  error.value = ''
  try {
    let assetId: string
    if (props.asset) {
      await assetsApi.update(props.asset.id, {
        name: form.name,
        base_price: Number(form.base_price),
        price_unit: form.price_unit,
        attributes: attrsObj,
      })
      assetId = props.asset.id
      toast.success('Asset updated')
    } else {
      const res = await assetsApi.create({
        type: form.type,
        name: form.name,
        base_price: Number(form.base_price),
        price_unit: form.price_unit,
        attributes: attrsObj,
      })
      assetId = res.data.data.id
      toast.success('Asset created')
    }

    for (const file of pendingFiles.value) {
      await assetsApi.uploadImage(assetId, file)
    }

    emit('saved')
  } catch (e) {
    error.value = extractError(e)
  } finally {
    saving.value = false
  }
}
</script>
