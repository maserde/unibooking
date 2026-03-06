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
import type { Asset } from '@/types/models'
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
    }
  },
)

async function save() {
  errors.name = ''
  errors.base_price = ''
  if (!form.name) { errors.name = 'Required'; return }
  if (!form.base_price) { errors.base_price = 'Required'; return }

  const attrsObj = Object.fromEntries(attributes.value.filter((a) => a.key).map((a) => [a.key, a.value]))

  saving.value = true
  error.value = ''
  try {
    if (props.asset) {
      await assetsApi.update(props.asset.id, {
        name: form.name,
        base_price: Number(form.base_price),
        price_unit: form.price_unit,
        attributes: attrsObj,
      })
      toast.success('Asset updated')
    } else {
      await assetsApi.create({
        type: form.type,
        name: form.name,
        base_price: Number(form.base_price),
        price_unit: form.price_unit,
        attributes: attrsObj,
      })
      toast.success('Asset created')
    }
    emit('saved')
  } catch (e) {
    error.value = extractError(e)
  } finally {
    saving.value = false
  }
}
</script>
