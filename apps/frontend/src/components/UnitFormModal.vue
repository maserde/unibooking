<template>
  <AppModal :model-value="modelValue" :title="unit ? 'Edit Unit' : 'Add Unit'" size="sm" @update:model-value="emit('update:modelValue', $event)">
    <AppAlert v-if="error" type="error" :message="error" class="mb-4" />
    <form class="space-y-4" @submit.prevent="save">
      <AppInput v-model="form.identifier" label="Identifier" placeholder="e.g. Room 101" :error="errors.identifier" />
      <AppSelect
        v-if="unit"
        v-model="form.status"
        label="Status"
        :options="[
          { value: 'AVAILABLE', label: 'Available' },
          { value: 'MAINTENANCE', label: 'Maintenance' },
          { value: 'BROKEN', label: 'Broken' },
        ]"
      />
    </form>
    <template #footer>
      <div class="flex justify-end gap-3">
        <AppButton variant="secondary" @click="emit('update:modelValue', false)">Cancel</AppButton>
        <AppButton :loading="saving" @click="save">{{ unit ? 'Save' : 'Add Unit' }}</AppButton>
      </div>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { assetsApi } from '@/api/assets'
import { useApiError } from '@/composables/useApiError'
import { useToast } from '@/composables/useToast'
import type { AssetUnit } from '@/types/models'
import type { AssetUnitStatus } from '@/types/enums'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'

const props = defineProps<{ modelValue: boolean; assetId: string; unit?: AssetUnit | null }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean]; saved: [] }>()
const { extractError } = useApiError()
const toast = useToast()

const form = reactive({ identifier: '', status: 'AVAILABLE' as AssetUnitStatus })
const errors = reactive({ identifier: '' })
const saving = ref(false)
const error = ref('')

watch(() => props.modelValue, (open) => {
  if (open) {
    form.identifier = props.unit?.identifier ?? ''
    form.status = props.unit?.status ?? 'AVAILABLE'
    error.value = ''
    errors.identifier = ''
  }
})

async function save() {
  if (!form.identifier) { errors.identifier = 'Required'; return }
  saving.value = true
  error.value = ''
  try {
    if (props.unit) {
      await assetsApi.updateUnit(props.assetId, props.unit.id, { identifier: form.identifier, status: form.status })
      toast.success('Unit updated')
    } else {
      await assetsApi.createUnit(props.assetId, { identifier: form.identifier })
      toast.success('Unit added')
    }
    emit('saved')
    emit('update:modelValue', false)
  } catch (e) {
    error.value = extractError(e)
  } finally {
    saving.value = false
  }
}
</script>
