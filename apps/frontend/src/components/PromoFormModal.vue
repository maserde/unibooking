<template>
  <AppModal :model-value="modelValue" :title="promo ? 'Edit Promo' : 'Tambah Kode Promo'" size="md" @update:model-value="emit('update:modelValue', $event)">
    <AppAlert v-if="error" type="error" :message="error" class="mb-4" />
    <form class="space-y-4" @submit.prevent="save">
      <AppInput v-model="form.code" label="Kode promo" placeholder="SUMMER20" :error="errors.code" />
      <AppSelect
        v-model="form.discount_type"
        label="Tipe diskon"
        :options="[{ value: 'PERCENTAGE', label: 'Persentase' }, { value: 'FIXED_AMOUNT', label: 'Jumlah tetap' }]"
      />
      <AppInput
        v-model="form.discount_value"
        label="Nilai diskon"
        type="number"
        :hint="form.discount_type === 'PERCENTAGE' ? 'misal 20 untuk 20%' : 'Jumlah dalam IDR'"
        :error="errors.discount_value"
      />
      <div class="grid grid-cols-2 gap-3">
        <AppDateTimePicker v-model="form.valid_from" label="Berlaku dari" :error="errors.valid_from" />
        <AppDateTimePicker v-model="form.valid_until" label="Berlaku sampai" :error="errors.valid_until" />
      </div>

      <details class="border border-gray-200 rounded-md">
        <summary class="px-4 py-2 text-sm font-medium text-gray-700 cursor-pointer">Pengaturan lanjutan</summary>
        <div class="p-4 space-y-3">
          <AppInput v-model="form.max_usage" label="Maks total penggunaan" type="number" hint="Kosongkan untuk tidak terbatas" />
          <AppInput v-model="form.max_usage_per_customer" label="Maks penggunaan per pelanggan" type="number" hint="Kosongkan untuk tidak terbatas" />
          <AppInput v-model="form.max_discount_amount" label="Maks jumlah diskon (IDR)" type="number" hint="Batas untuk diskon persentase" />
          <AppInput v-model="form.min_transaction_amount" label="Min transaksi (IDR)" type="number" />
        </div>
      </details>
    </form>
    <template #footer>
      <div class="flex justify-end gap-3">
        <AppButton variant="secondary" @click="emit('update:modelValue', false)">Batal</AppButton>
        <AppButton :loading="saving" @click="save">{{ promo ? 'Simpan perubahan' : 'Buat promo' }}</AppButton>
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
  if (!form.code) { errors.code = 'Wajib diisi'; return }
  if (!form.discount_value) { errors.discount_value = 'Wajib diisi'; return }
  if (!form.valid_from) { errors.valid_from = 'Wajib diisi'; return }
  if (!form.valid_until) { errors.valid_until = 'Wajib diisi'; return }

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
      toast.success('Promo diperbarui')
    } else {
      await promosApi.create(payload)
      toast.success('Promo dibuat')
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
