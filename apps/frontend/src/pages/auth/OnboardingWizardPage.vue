<template>
  <div>
    <h2 class="text-xl font-semibold text-gray-900 mb-2">Set up your account</h2>

    <!-- Step bar -->
    <div class="flex items-center gap-2 mb-6">
      <div v-for="s in 3" :key="s" :class="['h-1.5 flex-1 rounded-full transition-colors', step >= s ? 'bg-primary-600' : 'bg-gray-200']" />
    </div>
    <p class="text-xs text-gray-500 mb-4">Step {{ step }} of 3 — {{ stepLabels[step - 1] }}</p>

    <AppAlert v-if="errorMsg" type="error" :message="errorMsg" class="mb-4" />

    <!-- Step 1: Profile -->
    <form v-if="step === 1" class="space-y-4" @submit.prevent="nextStep">
      <AppInput v-model="profile.name" label="Business name" :error="profileErrors.name" />
      <AppInput v-model="profile.phone" label="Phone number" type="tel" :error="profileErrors.phone" />
      <AppInput v-model="profile.address" label="Address" :error="profileErrors.address" />
      <AppButton type="submit" class="w-full" :loading="loading">Continue</AppButton>
    </form>

    <!-- Step 2: Payment -->
    <form v-else-if="step === 2" class="space-y-4" @submit.prevent="nextStep">
      <div class="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
        <strong>Mayar.id API Key</strong> — Your payments are processed by Mayar.id. Enter your API key to enable payment collection. It will be encrypted and stored securely.
      </div>
      <AppInput v-model="payment.mayar_api_key" label="Mayar API Key" type="password" :error="paymentErrors.mayar_api_key" />
      <AppButton type="submit" class="w-full" :loading="loading">Continue</AppButton>
    </form>

    <!-- Step 3: First Asset -->
    <form v-else class="space-y-4" @submit.prevent="completeOnboarding">
      <AppSelect v-model="asset.type" label="Asset type" :options="[{ value: 'ROOM', label: 'Room' }, { value: 'PHYSICAL_ITEM', label: 'Physical Item' }]" :error="assetErrors.type" />
      <AppInput v-model="asset.name" label="Asset name" :error="assetErrors.name" />
      <AppInput v-model="asset.base_price" label="Base price (IDR)" type="number" :error="assetErrors.base_price" />
      <AppSelect v-model="asset.price_unit" label="Price unit" :options="[{ value: 'HOUR', label: 'Per hour' }, { value: 'DAY', label: 'Per day' }]" :error="assetErrors.price_unit" />

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Units</label>
        <div v-for="(_, i) in units" :key="i" class="flex gap-2 mb-2">
          <AppInput v-model="units[i].identifier" :placeholder="`Unit ${i + 1} identifier`" class="flex-1" />
          <AppButton v-if="units.length > 1" variant="ghost" size="sm" type="button" @click="units.splice(i, 1)">✕</AppButton>
        </div>
        <AppButton variant="secondary" size="sm" type="button" @click="units.push({ identifier: '' })">+ Add unit</AppButton>
      </div>

      <AppButton type="submit" class="w-full" :loading="loading">Finish setup</AppButton>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { merchantApi } from '@/api/merchant'
import { assetsApi } from '@/api/assets'
import { useAuthStore } from '@/stores/auth'
import { useApiError } from '@/composables/useApiError'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import type { AssetType, PriceUnit } from '@/types/enums'

const authStore = useAuthStore()
const router = useRouter()
const { extractError } = useApiError()

const step = ref(1)
const loading = ref(false)
const errorMsg = ref('')
const stepLabels = ['Business Profile', 'Payment Setup', 'First Asset']

const profile = reactive({ name: authStore.merchant?.name ?? '', phone: '', address: '' })
const profileErrors = reactive({ name: '', phone: '', address: '' })

const payment = reactive({ mayar_api_key: '' })
const paymentErrors = reactive({ mayar_api_key: '' })

const asset = reactive({ type: 'ROOM' as AssetType, name: '', base_price: '', price_unit: 'HOUR' as PriceUnit })
const assetErrors = reactive({ type: '', name: '', base_price: '', price_unit: '' })
const units = ref([{ identifier: '' }])

async function nextStep() {
  errorMsg.value = ''
  loading.value = true
  try {
    if (step.value === 1) {
      if (!profile.name) { profileErrors.name = 'Required'; loading.value = false; return }
      if (!profile.phone) { profileErrors.phone = 'Required'; loading.value = false; return }
      if (!profile.address) { profileErrors.address = 'Required'; loading.value = false; return }
      const res = await merchantApi.updateProfile({ name: profile.name, phone: profile.phone, address: profile.address })
      authStore.setMerchant(res.data.data)
      step.value = 2
    } else if (step.value === 2) {
      if (!payment.mayar_api_key) { paymentErrors.mayar_api_key = 'Required'; loading.value = false; return }
      await merchantApi.setupPayment({ mayar_api_key: payment.mayar_api_key })
      step.value = 3
    }
  } catch (e) {
    errorMsg.value = extractError(e)
  } finally {
    loading.value = false
  }
}

async function completeOnboarding() {
  errorMsg.value = ''
  if (!asset.name) { assetErrors.name = 'Required'; return }
  if (!asset.base_price) { assetErrors.base_price = 'Required'; return }

  loading.value = true
  try {
    await assetsApi.initialSetup({
      type: asset.type,
      name: asset.name,
      base_price: Number(asset.base_price),
      price_unit: asset.price_unit,
      units: units.value.filter((u) => u.identifier.trim()),
    })
    await authStore.fetchMe()
    router.push('/dashboard')
  } catch (e) {
    errorMsg.value = extractError(e)
  } finally {
    loading.value = false
  }
}
</script>
