import type { BookingStatus, PaymentStatus, AssetUnitStatus } from '@/types/enums'

interface StatusDisplay {
  label: string
  bg: string
  text: string
}

export function bookingStatusDisplay(status: BookingStatus): StatusDisplay {
  const map: Record<BookingStatus, StatusDisplay> = {
    PENDING_PAYMENT: { label: 'Menunggu Pembayaran', bg: 'bg-yellow-100', text: 'text-yellow-800' },
    CONFIRMED: { label: 'Dikonfirmasi', bg: 'bg-blue-100', text: 'text-blue-800' },
    ACTIVE: { label: 'Aktif', bg: 'bg-green-100', text: 'text-green-800' },
    COMPLETED: { label: 'Selesai', bg: 'bg-gray-100', text: 'text-gray-700' },
    CANCELLED: { label: 'Dibatalkan', bg: 'bg-red-100', text: 'text-red-800' },
  }
  return map[status]
}

export function paymentStatusDisplay(status: PaymentStatus): StatusDisplay {
  const map: Record<PaymentStatus, StatusDisplay> = {
    UNPAID: { label: 'Belum Dibayar', bg: 'bg-yellow-100', text: 'text-yellow-800' },
    PAID: { label: 'Lunas', bg: 'bg-green-100', text: 'text-green-800' },
    FAILED: { label: 'Gagal', bg: 'bg-red-100', text: 'text-red-800' },
    REFUNDED: { label: 'Dikembalikan', bg: 'bg-purple-100', text: 'text-purple-800' },
  }
  return map[status]
}

export function unitStatusDisplay(status: AssetUnitStatus): StatusDisplay {
  const map: Record<AssetUnitStatus, StatusDisplay> = {
    AVAILABLE: { label: 'Tersedia', bg: 'bg-green-100', text: 'text-green-800' },
    MAINTENANCE: { label: 'Perawatan', bg: 'bg-yellow-100', text: 'text-yellow-800' },
    BROKEN: { label: 'Rusak', bg: 'bg-red-100', text: 'text-red-800' },
  }
  return map[status]
}
