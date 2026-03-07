<template>
  <div class="max-w-2xl mx-auto">
    <RouterLink :to="`/store/${slug}`" class="text-sm text-gray-500 hover:text-gray-700">← Back to catalog</RouterLink>

    <h2 class="text-xl font-semibold text-gray-900 mt-4 mb-6">Book: {{ asset?.name }}</h2>

    <!-- Step indicator -->
    <div class="flex items-center gap-2 mb-6">
      <div v-for="s in 3" :key="s" :class="['h-1.5 flex-1 rounded-full', step >= s ? 'bg-primary-600' : 'bg-gray-200']" />
    </div>

    <AppAlert v-if="errorMsg" type="error" :message="errorMsg" class="mb-4" />

    <!-- Step 1: Duration Selection -->
    <div v-if="step === 1" class="space-y-4">
      <AppCard title="Select duration">
        <div class="space-y-4">
          <div>
            <p class="text-xs text-gray-500 mb-1">Start time</p>
            <p class="text-sm font-medium text-gray-900">
              {{ formatDateTime(booking.start_time) }}
              <span class="text-xs text-gray-400">(now)</span>
            </p>
          </div>
          <AppInput
            v-model="durationInput"
            :label="`Duration (${durationLabel})`"
            type="number"
            min="1"
            :error="durationError"
          />
          <div v-if="durationNum > 0">
            <p class="text-xs text-gray-500 mb-1">End time</p>
            <p class="text-sm font-medium text-gray-900">{{ formatDateTime(endTime) }}</p>
          </div>
        </div>
        <AppButton class="mt-4 w-full" :loading="checkingAvailability" :disabled="checkAvailabilityDisabled" @click="checkAvailability">Check Availability</AppButton>
      </AppCard>

      <AppCard v-if="availabilityChecked" title="Price preview">
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500">Duration</span>
            <span>{{ units }} {{ asset?.price_unit === 'HOUR' ? 'hour(s)' : 'day(s)' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Price per unit</span>
            <span>{{ asset ? formatCurrency(asset.base_price) : '—' }}</span>
          </div>
          <div class="flex justify-between font-semibold text-base border-t pt-2">
            <span>Subtotal</span>
            <span>{{ formatCurrency(subtotal) }}</span>
          </div>
        </div>
        <AppButton class="mt-4 w-full" :disabled="!isAvailable" @click="step = 2">
          {{ isAvailable ? 'Continue' : 'Not Available' }}
        </AppButton>
        <p v-if="!isAvailable" class="text-xs text-red-600 mt-2">No units available for the selected time range.</p>
      </AppCard>
    </div>

    <!-- Step 2: Customer Info -->
    <div v-else-if="step === 2" class="space-y-4">
      <AppCard title="Your information">
        <div class="space-y-4">
          <AppInput v-model="customer.name" label="Full name" :error="customerErrors.name" />
          <AppInput v-model="customer.email" label="Email" type="email" :error="customerErrors.email" />
          <AppInput v-model="customer.phone" label="Phone number" type="tel" />
        </div>
      </AppCard>

      <AppCard title="Promo code">
        <div class="flex gap-2">
          <AppInput v-model="promoCode" placeholder="Enter code" class="flex-1" />
          <AppButton variant="secondary" :loading="validatingPromo" @click="validatePromo">Apply</AppButton>
        </div>
        <AppAlert v-if="promoError" type="error" :message="promoError" class="mt-2" />
        <div v-if="promoResult" class="mt-2 text-sm text-green-700 font-medium">
          Promo applied! Discount: {{ formatCurrency(promoResult.discount_amount) }}
        </div>
      </AppCard>

      <AppCard title="Price breakdown">
        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-gray-500">Subtotal</span><span>{{ formatCurrency(subtotal) }}</span></div>
          <div v-if="promoResult" class="flex justify-between text-green-700">
            <span>Discount</span><span>-{{ formatCurrency(promoResult.discount_amount) }}</span>
          </div>
          <div class="flex justify-between font-semibold border-t pt-2"><span>Total</span><span>{{ formatCurrency(total) }}</span></div>
          <div class="flex justify-between text-gray-500">
            <span>Upfront fee ({{ upfrontPct }}%)</span>
            <span>{{ formatCurrency(upfrontFee) }}</span>
          </div>
        </div>
        <div class="flex gap-3 mt-4">
          <AppButton variant="secondary" @click="step = 1">Back</AppButton>
          <AppButton class="flex-1" @click="goToConfirm">Continue</AppButton>
        </div>
      </AppCard>
    </div>

    <!-- Step 3: Confirm -->
    <div v-else class="space-y-4">
      <AppCard title="Booking summary">
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between"><dt class="text-gray-500">Asset</dt><dd>{{ asset?.name }}</dd></div>
          <div class="flex justify-between"><dt class="text-gray-500">Start</dt><dd>{{ formatDateTime(booking.start_time) }}</dd></div>
          <div class="flex justify-between"><dt class="text-gray-500">End</dt><dd>{{ formatDateTime(endTime) }}</dd></div>
          <div class="flex justify-between"><dt class="text-gray-500">Name</dt><dd>{{ customer.name }}</dd></div>
          <div class="flex justify-between"><dt class="text-gray-500">Email</dt><dd>{{ customer.email }}</dd></div>
          <div class="flex justify-between font-semibold border-t pt-2"><dt>Total</dt><dd>{{ formatCurrency(total) }}</dd></div>
          <div class="flex justify-between"><dt class="text-gray-500">Pay now</dt><dd>{{ formatCurrency(upfrontFee) }}</dd></div>
        </dl>
        <div class="flex gap-3 mt-4">
          <AppButton variant="secondary" @click="step = 2">Back</AppButton>
          <AppButton class="flex-1" :loading="submitting" @click="submitBooking">Pay Now</AppButton>
        </div>
      </AppCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { publicApi } from '@/api/public'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { PublicCatalogResponse, PublicAsset, PromoValidateResponse } from '@/types/api'
import type { PriceUnit } from '@/types/enums'
import AppCard from '@/components/ui/AppCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'

const route = useRoute()
const router = useRouter()
const slug = route.params.slug as string
const assetId = route.query.assetId as string

const step = ref(1)
const catalog = ref<PublicCatalogResponse | null>(null)
// Backend returns catalog array, not assets
const asset = computed<PublicAsset | undefined>(() => catalog.value?.catalog.find((a) => a.id === assetId))

const booking = reactive({ start_time: new Date().toISOString() })
const durationInput = ref('1')
const durationError = ref('')
const customer = reactive({ name: '', email: '', phone: '' })
const customerErrors = reactive({ name: '', email: '' })

// Price calculation
const priceUnit = computed<PriceUnit>(() => asset.value?.price_unit ?? 'HOUR')
const basePrice = computed(() => asset.value?.base_price ?? 0)
// Merchant upfront_fee_percentage — public catalog endpoint returns merchant without this field
// Fall back to 30% default if not available
const upfrontPct = computed(() => catalog.value?.merchant.upfront_fee_percentage ?? 30)

const durationNum = computed(() => {
  const n = parseInt(durationInput.value, 10)
  return isNaN(n) || n <= 0 ? 0 : n
})
const durationLabel = computed(() => priceUnit.value === 'HOUR' ? 'hours' : 'days')
const endTime = computed(() => {
  if (!booking.start_time || durationNum.value <= 0) return ''
  const unitMs = priceUnit.value === 'HOUR' ? 3600000 : 86400000
  return new Date(new Date(booking.start_time).getTime() + durationNum.value * unitMs).toISOString()
})
const units = computed(() => durationNum.value)

const checkedDuration = ref<number | null>(null)
const checkAvailabilityDisabled = computed(() => durationNum.value > 0 && durationNum.value === checkedDuration.value)

const checkingAvailability = ref(false)
const availabilityChecked = ref(false)
const isAvailable = ref(false)
const errorMsg = ref('')

watch(durationNum, () => {
  availabilityChecked.value = false
  isAvailable.value = false
})

const promoCode = ref('')
const validatingPromo = ref(false)
const promoError = ref('')
const promoResult = ref<PromoValidateResponse | null>(null)

const submitting = ref(false)

const subtotal = computed(() => units.value * basePrice.value)
const discountAmount = computed(() => promoResult.value?.discount_amount ?? 0)
const total = computed(() => Math.max(0, subtotal.value - discountAmount.value))
const upfrontFee = computed(() => Math.ceil((total.value * upfrontPct.value) / 100))

async function checkAvailability() {
  durationError.value = ''
  if (durationNum.value <= 0) { durationError.value = 'Enter a valid duration'; return }

  checkingAvailability.value = true
  errorMsg.value = ''
  try {
    const res = await publicApi.availability(slug, assetId, {
      start_time: booking.start_time,
      end_time: endTime.value,
    })
    isAvailable.value = res.data.data.available
    availabilityChecked.value = true
    checkedDuration.value = durationNum.value
  } catch (e) {
    const err = e as { response?: { data?: { error?: string } } }
    errorMsg.value = err.response?.data?.error ?? 'Failed to check availability'
  } finally {
    checkingAvailability.value = false
  }
}

async function validatePromo() {
  promoError.value = ''
  promoResult.value = null
  if (!promoCode.value) return
  validatingPromo.value = true
  try {
    // Backend expects { code, total_price } (not total_amount)
    const res = await publicApi.validatePromo(slug, { code: promoCode.value, total_price: subtotal.value })
    promoResult.value = res.data.data
  } catch (e) {
    const err = e as { response?: { data?: { error?: string } } }
    promoError.value = err.response?.data?.error ?? 'Invalid promo code'
  } finally {
    validatingPromo.value = false
  }
}

function goToConfirm() {
  customerErrors.name = ''
  customerErrors.email = ''
  if (!customer.name) { customerErrors.name = 'Required'; return }
  if (!customer.email) { customerErrors.email = 'Required'; return }
  step.value = 3
}

async function submitBooking() {
  submitting.value = true
  errorMsg.value = ''
  try {
    const res = await publicApi.createBooking(slug, {
      asset_id: assetId,
      start_time: booking.start_time,
      end_time: endTime.value,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone || undefined,
      promo_code: promoCode.value || undefined,
    })
    const { payment_link, booking: b } = res.data.data
    sessionStorage.setItem('last_booking_id', b.id)
    sessionStorage.setItem('last_booking_email', customer.email)
    window.location.href = payment_link
  } catch (e) {
    const err = e as { response?: { data?: { error?: string } } }
    errorMsg.value = err.response?.data?.error ?? 'Failed to create booking'
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const res = await publicApi.catalog(slug)
    catalog.value = res.data.data
  } catch {
    router.push(`/store/${slug}`)
  }
})
</script>
