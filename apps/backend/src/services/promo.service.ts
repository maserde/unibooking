import { promoCodeRepository } from '../repositories/promoCode.repository';
import { bookingRepository } from '../repositories/booking.repository';
import { AppError } from '../middleware/error.middleware';
import type { PromoCode } from '../types/models';
import type { DiscountType } from '../types/enums';

export interface PromoValidationResult {
  promo: PromoCode;
  discountAmount: number;
}

export const promoService = {
  async listPromos(merchantId: string): Promise<PromoCode[]> {
    return promoCodeRepository.findAll(merchantId);
  },

  async createPromo(
    merchantId: string,
    data: Omit<PromoCode, 'id' | 'merchant_id' | 'created_at' | 'updated_at'>,
  ): Promise<PromoCode> {
    const existing = await promoCodeRepository.findByCode(merchantId, data.code);
    if (existing) throw new AppError('Kode promo sudah ada', 409);
    return promoCodeRepository.create(merchantId, data);
  },

  async updatePromo(
    merchantId: string,
    promoId: string,
    data: Partial<Omit<PromoCode, 'id' | 'merchant_id' | 'created_at' | 'updated_at'>>,
  ): Promise<PromoCode> {
    const promo = await promoCodeRepository.findById(merchantId, promoId);
    if (!promo) throw new AppError('Kode promo tidak ditemukan', 404);
    await promoCodeRepository.update(merchantId, promoId, data);
    return (await promoCodeRepository.findById(merchantId, promoId))!;
  },

  async deletePromo(merchantId: string, promoId: string): Promise<void> {
    const promo = await promoCodeRepository.findById(merchantId, promoId);
    if (!promo) throw new AppError('Kode promo tidak ditemukan', 404);
    await promoCodeRepository.delete(merchantId, promoId);
  },

  async validatePromo(
    merchantId: string,
    code: string,
    totalPrice: number,
    customerId?: string,
  ): Promise<PromoValidationResult> {
    const promo = await promoCodeRepository.findByCode(merchantId, code);
    if (!promo) throw new AppError('Kode promo tidak ditemukan', 404);

    // 1. Active check
    if (!promo.is_active) throw new AppError('Kode promo tidak aktif', 422);

    // 2. Validity period
    const now = new Date();
    if (now < promo.valid_from || now > promo.valid_until) {
      throw new AppError('Kode promo sudah kedaluwarsa atau belum berlaku', 422);
    }

    // 3. Total quota
    if (promo.max_usage !== null && promo.max_usage !== undefined) {
      const used = await bookingRepository.countPromoUsage(promo.id);
      if (used >= promo.max_usage) throw new AppError('Kuota kode promo sudah habis', 422);
    }

    // 4. Per-customer quota
    if (customerId && promo.max_usage_per_customer !== null && promo.max_usage_per_customer !== undefined) {
      const customerUsed = await bookingRepository.countPromoUsageByCustomer(promo.id, customerId);
      if (customerUsed >= promo.max_usage_per_customer) {
        throw new AppError('Anda sudah mencapai batas penggunaan kode promo ini', 422);
      }
    }

    // 5. Min transaction
    if (promo.min_transaction_amount !== null && promo.min_transaction_amount !== undefined) {
      if (totalPrice < promo.min_transaction_amount) {
        throw new AppError(
          `Minimum transaksi adalah Rp ${promo.min_transaction_amount.toLocaleString('id-ID')}`,
          422,
        );
      }
    }

    // 6. Calculate discount
    let discountAmount: number;
    if (promo.discount_type === 'PERCENTAGE') {
      discountAmount = (totalPrice * promo.discount_value) / 100;
      if (promo.max_discount_amount !== null && promo.max_discount_amount !== undefined) {
        discountAmount = Math.min(discountAmount, promo.max_discount_amount);
      }
    } else {
      discountAmount = promo.discount_value;
    }

    discountAmount = Math.min(discountAmount, totalPrice);
    discountAmount = parseFloat(discountAmount.toFixed(2));

    return { promo, discountAmount };
  },
};
