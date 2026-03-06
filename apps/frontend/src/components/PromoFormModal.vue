<template>
  <AppModal :model-value="modelValue" :title="promo ? 'Edit Promo' : 'Add Promo Code'" size="md" @update:model-value="emit('update:modelValue', $event)">
    <AppAlert v-if="error" type="error" :message="error" class="mb-4" />
    <form class="space-y-4" @submit.prevent="save">
      <AppInput v-model="form.code" label="Promo code" placeholder="SUMMER20" :error="errors.code" />
      <AppSelect
        v-model="form.discount_type"
        label="Discount type"
        :options="[{ value: 'PERCENTAGE', label: 'Percentage' }, { value: 'FIXED_AMOUNT', label: 'Fixed amount' }]"
      />
      <AppInput
        v-model="form.discount_value"
        label="Discount value"
        type="number"
        :hint="form.discount_type === 'PERCENTAGE' ? 'e.g. 20 for 20%' : 'Amount in IDR'"
        :error="errors.discount_value"
      />
      <div class="grid grid-cols-2 gap-3">
        <AppDateTimePicker v-model="form.valid_from" label="Valid from" :error="errors.valid_from" />
        <AppDateTimePicker v-model="form.valid_until" label="Valid until" :error="errors.valid_until" />
      </div>

      <details class="border border-gray-200 rounded-md">
        <summary class="px-4 py-2 text-sm font-medium text-gray-700 cursor-pointer">Advanced settings</summary>
        <div class="p-4 space-y-3">
          <AppInput v-model="form.max_usage" label="Max total uses" type="number" hint="Leave empty for unlimited" />
          <AppInput v-model="form.max_usage_per_customer" label="Max uses per customer" type="number" hint="Leave empty for unlimited" />
          <AppInput v-model="form.max_discount_amount" label="Max discount amount (IDR)" type="number" hint="Cap for percentage discounts" />
          <AppInput v-model="form.min_transaction_amount" label="Min transaction (IDR)" type="number" />
        </div>
      </details>
    </form>
    <template #footer>
      <div class="flex justify-end gap-3">
        <AppButton variant="secondary" @click="emit('update:modelValue', false)">Cancel</AppButton>
        <AppButton :loading="saving" @click="save">{{ promo ? 'Save changes' : 'Create promo' }}</AppButton>
      </div>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { promosApi } from '@/api/promos'
import { useApiError } from '@/composables/useApiError'
import { useToast } from '@/composables/useToast'
import type { PromoCode } from '@/types/models'
import type { DiscountType } from '@/types/enums'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppDateTimePicker from '@/components/ui/AppDateTimePicker.vue'

const props = defineProps<{ modelValue: boolean; promo?: PromoCode | null }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean]; saved: [] }>()
const { extractError } = useApiError()
const toast = useToast()

const defaultForm = () => ({
  code: '',
  discount_type: 'PERCENTAGE' as DiscountType,
  discount_value: '',
  valid_from: '',
  valid_until: '',
  max_usage: '',
  max_usage_per_customer: '',
  max_discount_amount: '',
  min_transaction_amount: '',
})

const form = reactive(defaultForm())
const errors = reactive({ code: '', discount_value: '', valid_from: '', valid_until: '' })
const saving = ref(false)
const error = ref('')

watch(() => props.modelValue, (open) => {
  if (open) {
    const p = props.promo
    form.code = p?.code ?? ''
    form.discount_type = p?.discount_type ?? 'PERCENTAGE'
    form.discount_value = String(p?.discount_value ?? '')
    form.valid_from = p?.valid_from ? p.valid_from.slice(0, 16) : ''
    form.valid_until = p?.valid_until ? p.valid_until.slice(0, 16) : ''
    form.max_usage = String(p?.max_usage ?? '')
    form.max_usage_per_customer = String(p?.max_usage_per_customer ?? '')
    form.max_discount_amount = String(p?.max_discount_amount ?? '')
    form.min_transaction_amount = String(p?.min_transaction_amount ?? '')
    error.value = ''
  }
})

async function save() {
  errors.code = ''
  errors.discount_value = ''
  errors.valid_from = ''
  errors.valid_until = ''
  if (!form.code) { errors.code = 'Required'; return }
  if (!form.discount_value) { errors.discount_value = 'Required'; return }
  if (!form.valid_from) { errors.valid_from = 'Required'; return }
  if (!form.valid_until) { errors.valid_until = 'Required'; return }

  saving.value = true
  error.value = ''
  try {
    const payload = {
      code: form.code,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      valid_from: new Date(form.valid_from).toISOString(),
      valid_until: new Date(form.valid_until).toISOString(),
      ...(form.max_usage ? { max_usage: Number(form.max_usage) } : {}),
      ...(form.max_usage_per_customer ? { max_usage_per_customer: Number(form.max_usage_per_customer) } : {}),
      ...(form.max_discount_amount ? { max_discount_amount: Number(form.max_discount_amount) } : {}),
      ...(form.min_transaction_amount ? { min_transaction_amount: Number(form.min_transaction_amount) } : {}),
    }
    if (props.promo) {
      await promosApi.update(props.promo.id, payload)
      toast.success('Promo updated')
    } else {
      await promosApi.create(payload)
      toast.success('Promo created')
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
