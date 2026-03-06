<template>
  <AppModal :model-value="modelValue" title="Invite Staff" size="sm" @update:model-value="emit('update:modelValue', $event)">
    <AppAlert v-if="error" type="error" :message="error" class="mb-4" />
    <form class="space-y-4" @submit.prevent="save">
      <AppInput v-model="form.full_name" label="Full name" :error="errors.full_name" />
      <AppInput v-model="form.email" label="Email" type="email" :error="errors.email" />
      <AppSelect v-model="form.role" label="Role" :options="[{ value: 'ADMIN', label: 'Admin' }, { value: 'STAFF', label: 'Staff' }]" />
    </form>
    <template #footer>
      <div class="flex justify-end gap-3">
        <AppButton variant="secondary" @click="emit('update:modelValue', false)">Cancel</AppButton>
        <AppButton :loading="saving" @click="save">Invite</AppButton>
      </div>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { staffApi } from '@/api/staff'
import { useApiError } from '@/composables/useApiError'
import { useToast } from '@/composables/useToast'
import type { MerchantUserRole } from '@/types/enums'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean]; saved: [] }>()
const { extractError } = useApiError()
const toast = useToast()

const form = reactive({ full_name: '', email: '', role: 'STAFF' as MerchantUserRole })
const errors = reactive({ full_name: '', email: '' })
const saving = ref(false)
const error = ref('')

watch(() => props.modelValue, (open) => {
  if (open) {
    form.full_name = ''
    form.email = ''
    form.role = 'STAFF'
    error.value = ''
  }
})

async function save() {
  errors.full_name = ''
  errors.email = ''
  if (!form.full_name) { errors.full_name = 'Required'; return }
  if (!form.email) { errors.email = 'Required'; return }

  saving.value = true
  error.value = ''
  try {
    await staffApi.invite(form)
    toast.success('Staff invited')
    emit('saved')
    emit('update:modelValue', false)
  } catch (e) {
    error.value = extractError(e)
  } finally {
    saving.value = false
  }
}
</script>
