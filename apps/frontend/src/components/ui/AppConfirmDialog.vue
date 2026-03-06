<template>
  <AppModal :model-value="modelValue" :title="title" size="sm" @update:model-value="emit('update:modelValue', $event)">
    <p class="text-sm text-gray-600">{{ description }}</p>
    <template #footer>
      <div class="flex justify-end gap-3">
        <AppButton variant="secondary" @click="emit('update:modelValue', false)">Cancel</AppButton>
        <AppButton :variant="danger ? 'danger' : 'primary'" :loading="loading" @click="confirm">
          {{ confirmLabel }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import AppModal from './AppModal.vue'
import AppButton from './AppButton.vue'

withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    description: string
    confirmLabel?: string
    danger?: boolean
    loading?: boolean
  }>(),
  { confirmLabel: 'Confirm', danger: false, loading: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
}>()

function confirm() {
  emit('confirm')
}
</script>
