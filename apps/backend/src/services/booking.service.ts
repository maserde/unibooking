import { merchantRepository } from '../repositories/merchant.repository';
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
    if (!merchant) throw new AppError('Merchant not found', 404);

    // 2. Validate asset
    const asset = await assetRepository.findById(merchant.id, input.assetId);
    if (!asset) throw new AppError('Asset not found', 404);

    if (input.startTime >= input.endTime) {
      throw new AppError('End time must be after start time', 422);
    }

    // 3. Check availability
    const availableUnits = await bookingRepository.findAvailableUnits(
      input.assetId,
      input.startTime,
      input.endTime,
    );
    if (availableUnits.length === 0) {
      throw new AppError('No available units for the selected time range', 422);
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
    if (!booking) throw new AppError('Booking not found', 404);

    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['ACTIVE', 'CANCELLED'],
      ACTIVE: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[booking.status].includes(status)) {
      throw new AppError(
        `Cannot transition from ${booking.status} to ${status}`,
        422,
      );
    }

    await bookingRepository.updateStatus(merchantId, bookingId, status);
    return (await bookingRepository.findDetailedById(merchantId, bookingId))!;
  },

  async checkAvailability(
    slug: string,
    assetId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<{ available: boolean; availableCount: number }> {
    const merchant = await merchantRepository.findBySlug(slug);
    if (!merchant) throw new AppError('Merchant not found', 404);

    const units = await bookingRepository.findAvailableUnits(assetId, startTime, endTime);
    return { available: units.length > 0, availableCount: units.length };
  },
};
