import { format, differenceInHours, differenceInDays } from 'date-fns'
import type { PriceUnit } from '@/types/enums'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy, HH:mm')
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatDuration(start: string | Date, end: string | Date, unit: PriceUnit): string {
  const s = new Date(start)
  const e = new Date(end)
  if (unit === 'HOUR') {
    const h = differenceInHours(e, s)
    return `${h} hour${h !== 1 ? 's' : ''}`
  }
  const d = differenceInDays(e, s)
  return `${d} day${d !== 1 ? 's' : ''}`
}
