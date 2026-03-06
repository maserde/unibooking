<template>
  <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', display.bg, display.text]">
    {{ display.label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { bookingStatusDisplay, paymentStatusDisplay, unitStatusDisplay } from '@/utils/status'
import type { BookingStatus, PaymentStatus, AssetUnitStatus } from '@/types/enums'

const props = defineProps<{
  status: string
  type?: 'booking' | 'payment' | 'unit'
}>()

const display = computed(() => {
  if (props.type === 'payment') return paymentStatusDisplay(props.status as PaymentStatus) ?? { label: props.status, bg: 'bg-gray-100', text: 'text-gray-700' }
  if (props.type === 'unit') return unitStatusDisplay(props.status as AssetUnitStatus) ?? { label: props.status, bg: 'bg-gray-100', text: 'text-gray-700' }
  return bookingStatusDisplay(props.status as BookingStatus) ?? { label: props.status, bg: 'bg-gray-100', text: 'text-gray-700' }
})
</script>
