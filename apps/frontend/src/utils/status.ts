import type { BookingStatus, PaymentStatus, AssetUnitStatus } from '@/types/enums'

interface StatusDisplay {
  label: string
  bg: string
  text: string
}

export function bookingStatusDisplay(status: BookingStatus): StatusDisplay {
  const map: Record<BookingStatus, StatusDisplay> = {
    PENDING_PAYMENT: { label: 'Pending Payment', bg: 'bg-yellow-100', text: 'text-yellow-800' },
    CONFIRMED: { label: 'Confirmed', bg: 'bg-blue-100', text: 'text-blue-800' },
    ACTIVE: { label: 'Active', bg: 'bg-green-100', text: 'text-green-800' },
    COMPLETED: { label: 'Completed', bg: 'bg-gray-100', text: 'text-gray-700' },
    CANCELLED: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-800' },
  }
  return map[status]
}

export function paymentStatusDisplay(status: PaymentStatus): StatusDisplay {
  const map: Record<PaymentStatus, StatusDisplay> = {
    UNPAID: { label: 'Unpaid', bg: 'bg-yellow-100', text: 'text-yellow-800' },
    PAID: { label: 'Paid', bg: 'bg-green-100', text: 'text-green-800' },
    FAILED: { label: 'Failed', bg: 'bg-red-100', text: 'text-red-800' },
    REFUNDED: { label: 'Refunded', bg: 'bg-purple-100', text: 'text-purple-800' },
  }
  return map[status]
}

export function unitStatusDisplay(status: AssetUnitStatus): StatusDisplay {
  const map: Record<AssetUnitStatus, StatusDisplay> = {
    AVAILABLE: { label: 'Available', bg: 'bg-green-100', text: 'text-green-800' },
    MAINTENANCE: { label: 'Maintenance', bg: 'bg-yellow-100', text: 'text-yellow-800' },
    BROKEN: { label: 'Broken', bg: 'bg-red-100', text: 'text-red-800' },
  }
  return map[status]
}
