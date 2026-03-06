import { computed, type Ref } from 'vue'
import type { PriceUnit } from '@/types/enums'

export function useBookingPrice(
  startTime: Ref<string>,
  endTime: Ref<string>,
  basePrice: Ref<number>,
  priceUnit: Ref<PriceUnit>,
  upfrontFeePercent: Ref<number>,
  discountAmount: Ref<number>,
) {
  const units = computed(() => {
    if (!startTime.value || !endTime.value) return 0
    const start = new Date(startTime.value)
    const end = new Date(endTime.value)
    const diffMs = end.getTime() - start.getTime()
    if (diffMs <= 0) return 0
    const unitSize = priceUnit.value === 'HOUR' ? 3600000 : 86400000
    return Math.ceil(diffMs / unitSize)
  })

  const subtotal = computed(() => units.value * basePrice.value)

  const total = computed(() => Math.max(0, subtotal.value - discountAmount.value))

  const upfrontFee = computed(() => Math.ceil((total.value * upfrontFeePercent.value) / 100))

  return { units, subtotal, total, upfrontFee }
}
