export const MerchantUserRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
} as const;
export type MerchantUserRole = (typeof MerchantUserRole)[keyof typeof MerchantUserRole];

export const AssetType = {
  ROOM: 'ROOM',
  PHYSICAL_ITEM: 'PHYSICAL_ITEM',
} as const;
export type AssetType = (typeof AssetType)[keyof typeof AssetType];

export const PriceUnit = {
  HOUR: 'HOUR',
  DAY: 'DAY',
} as const;
export type PriceUnit = (typeof PriceUnit)[keyof typeof PriceUnit];

export const AssetUnitStatus = {
  AVAILABLE: 'AVAILABLE',
  MAINTENANCE: 'MAINTENANCE',
  BROKEN: 'BROKEN',
} as const;
export type AssetUnitStatus = (typeof AssetUnitStatus)[keyof typeof AssetUnitStatus];

export const BookingStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  CONFIRMED: 'CONFIRMED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const PaymentStatus = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];
