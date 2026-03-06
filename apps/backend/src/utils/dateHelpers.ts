import type { PriceUnit } from '../types/enums';

/**
 * Calculate duration in hours or days between two dates.
 * Rounds up to next whole unit.
 */
export function calculateDuration(start: Date, end: Date, unit: PriceUnit): number {
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;
  const diffHours = diffMs / (1000 * 60 * 60);
  if (unit === 'DAY') {
    return Math.ceil(diffHours / 24);
  }
  return Math.ceil(diffHours);
}

/**
 * Calculate total price: duration × base_price
 */
export function calculateTotalPrice(
  start: Date,
  end: Date,
  basePrice: number,
  unit: PriceUnit,
): number {
  const duration = calculateDuration(start, end, unit);
  return parseFloat((duration * basePrice).toFixed(2));
}
