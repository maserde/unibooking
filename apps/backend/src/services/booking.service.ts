import { merchantRepository } from '../repositories/merchant.repository';
import { paymentRepository } from '../repositories/payment.repository';
import { customerRepository } from '../repositories/customer.repository';
import { assetRepository } from '../repositories/asset.repository';
import { bookingRepository } from '../repositories/booking.repository';
import { promoService } from './promo.service';
import { paymentService } from './payment.service';
import { magicLinkService } from './magicLink.service';
import { notificationService } from './notification.service';
import { calculateTotalPrice } from '../utils/dateHelpers';
import { AppError } from '../middleware/error.middleware';
import type { Booking, Payment } from '../types/models';
import type { BookingStatus } from '../types/enums';

export interface CreateBookingInput {
  slug: string;
  assetId: string;
  startTime: Date;
  endTime: Date;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  promoCode?: string;
}

export const bookingService = {
  async createBooking(input: CreateBookingInput): Promise<{ booking: Booking; payment: Payment }> {
    // 1. Resolve slug → merchant
    const merchant = await merchantRepository.findBySlug(input.slug);
    if (!merchant) throw new AppError('Merchant tidak ditemukan', 404);

    // 2. Validate asset
    const asset = await assetRepository.findById(merchant.id, input.assetId);
    if (!asset) throw new AppError('Aset tidak ditemukan', 404);

    if (input.startTime >= input.endTime) {
      throw new AppError('Waktu selesai harus setelah waktu mulai', 422);
    }

    // 3. Check availability
    const availableUnits = await bookingRepository.findAvailableUnits(
      input.assetId,
      input.startTime,
      input.endTime,
    );
    if (availableUnits.length === 0) {
      throw new AppError('Tidak ada unit tersedia untuk rentang waktu yang dipilih', 422);
    }
    const selectedUnit = availableUnits[0];

    // 4. Find or create customer
    const customer = await customerRepository.findOrCreate(merchant.id, {
      name: input.customerName,
      email: input.customerEmail,
      phone_number: input.customerPhone,
    });

    // 5. Calculate price
    let totalPrice = calculateTotalPrice(input.startTime, input.endTime, asset.base_price, asset.price_unit);
    let discountAmount = 0;
    let promoCodeId: string | undefined;

    // 6. Validate promo code if provided
    if (input.promoCode) {
      const promoResult = await promoService.validatePromo(
        merchant.id,
        input.promoCode,
        totalPrice,
        customer.id,
      );
      discountAmount = promoResult.discountAmount;
      promoCodeId = promoResult.promo.id;
      totalPrice = parseFloat((totalPrice - discountAmount).toFixed(2));
    }

    // 7. Calculate upfront fee
    const upfrontFee = parseFloat(
      ((totalPrice * merchant.upfront_fee_percentage) / 100).toFixed(2),
    );

    // 8. Create booking
    const booking = await bookingRepository.create({
      merchantId: merchant.id,
      customerId: customer.id,
      assetUnitId: selectedUnit.id,
      promoCodeId,
      startTime: input.startTime,
      endTime: input.endTime,
      totalPrice,
      upfrontFee,
      discountAmount,
    });

    // 9. Create payment link
    const payment = await paymentService.createPaymentLink(
      merchant.id,
      booking.id,
      upfrontFee,
      `${asset.name} booking`,
      customer.email,
      customer.phone_number,
      customer.id,
      merchant.slug,
    );

    // 10. Send booking confirmation email with magic link (24h TTL)
    const magicLinkToken = await magicLinkService.generateTokenForCustomer(customer.id, 24 * 60);
    await notificationService.sendBookingCreated(customer.email, {
      customerName: customer.name,
      bookingId: booking.id,
      assetName: asset.name,
      startTime: input.startTime,
      endTime: input.endTime,
      totalPrice,
      upfrontFee,
      paymentLink: payment.payment_link ?? null,
      merchantName: merchant.name,
      merchantSlug: input.slug,
      magicLinkToken,
    });

    return { booking, payment };
  },

  async updateStatus(
    merchantId: string,
    bookingId: string,
    status: BookingStatus,
  ): Promise<Record<string, unknown>> {
    const booking = await bookingRepository.findById(merchantId, bookingId);
    if (!booking) throw new AppError('Pemesanan tidak ditemukan', 404);

    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['ACTIVE', 'CANCELLED'],
      ACTIVE: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[booking.status].includes(status)) {
      throw new AppError(
        `Tidak dapat mengubah status dari ${booking.status} ke ${status}`,
        422,
      );
    }

    await bookingRepository.updateStatus(merchantId, bookingId, status);
    return (await bookingRepository.findDetailedById(merchantId, bookingId))!;
  },

  async chargeRemainder(
    merchantId: string,
    bookingId: string,
  ): Promise<Record<string, unknown>> {
    const booking = await bookingRepository.findDetailedById(merchantId, bookingId);
    if (!booking) throw new AppError('Pemesanan tidak ditemukan', 404);

    if (booking.status !== 'ACTIVE') {
      throw new AppError('Sisa pembayaran hanya bisa ditagih saat pemesanan aktif', 422);
    }

    const remainder = (booking.total_price as number) - (booking.upfront_fee as number);
    if (remainder <= 0) {
      throw new AppError('DP sudah mencakup total — tidak ada sisa yang perlu ditagih', 422);
    }

    const existing = await paymentRepository.findRemainderByBookingId(bookingId);
    if (existing) throw new AppError('Tagihan sisa pembayaran sudah dibuat', 409);

    const merchant = await merchantRepository.findById(merchantId);
    if (!merchant) throw new AppError('Merchant tidak ditemukan', 404);

    const payment = await paymentService.createPaymentLink(
      merchantId,
      bookingId,
      remainder,
      `${booking.asset_name as string} — remaining balance`,
      booking.customer_email as string,
      (booking.customer_phone as string) ?? '',
      booking.customer_id as string,
      merchant.slug,
      'REMAINDER',
    );

    await notificationService.sendRemainderPayment(booking.customer_email as string, {
      customerName: booking.customer_name as string,
      merchantName: merchant.name,
      assetName: booking.asset_name as string,
      bookingId,
      remainderAmount: remainder,
      paymentLink: payment.payment_link ?? '',
    });

    return (await bookingRepository.findDetailedById(merchantId, bookingId))!;
  },

  async checkAvailability(
    slug: string,
    assetId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<{ available: boolean; availableCount: number }> {
    const merchant = await merchantRepository.findBySlug(slug);
    if (!merchant) throw new AppError('Merchant tidak ditemukan', 404);

    const units = await bookingRepository.findAvailableUnits(assetId, startTime, endTime);
    return { available: units.length > 0, availableCount: units.length };
  },
};
