import type { Request, Response } from 'express';
import { paymentRepository } from '../repositories/payment.repository';
import { bookingRepository } from '../repositories/booking.repository';
import { customerRepository } from '../repositories/customer.repository';
import { merchantRepository } from '../repositories/merchant.repository';
import { notificationService } from '../services/notification.service';
import { logger } from '../config/logger';

export const webhookController = {
  async handleMayar(req: Request, res: Response): Promise<void> {
    // Mayar does not implement webhook signature verification.
    // The endpoint is protected by obscurity of the URL and rate limiting.
    let payload: { event: string; data: Record<string, unknown> };
    try {
      payload = JSON.parse((req.body as Buffer).toString('utf8'));
    } catch {
      res.status(400).json({ received: false });
      return;
    }

    const { event, data } = payload;
    logger.info('Mayar webhook received', { event, id: data?.id });

    // Mayar fires 'payment.received' when a customer completes payment
    if (event === 'payment.received') {
      // data.productId = payment request ID stored as mayar_transaction_id at creation
      const mayarProductId = data?.productId as string | undefined;
      // data.id / data.transactionId = the actual completed transaction ID
      const mayarTransactionId = data?.transactionId as string | undefined;

      // 1. Find our payment record by the payment request ID (productId)
      let payment = mayarProductId
        ? await paymentRepository.findByMayarTransactionId(mayarProductId)
        : null;

      // 2. Fallback: extract booking ID from productDescription ("Booking <id>")
      if (!payment) {
        const bookingId = (data?.productDescription as string)?.replace('Booking ', '').trim();
        if (bookingId) {
          payment = await paymentRepository.findByBookingId(bookingId);
        }
      }

      if (!payment) {
        logger.warn('Webhook: payment record not found', { mayarProductId });
        res.status(200).json({ received: true });
        return;
      }

      const booking = await bookingRepository.findByIdPublic(payment.booking_id);
      if (!booking) {
        res.status(200).json({ received: true });
        return;
      }

      // 3. Confirm data.status === 'SUCCESS' (payment actually succeeded)
      if (data?.status !== 'SUCCESS') {
        logger.info('Webhook: payment.received but status not SUCCESS, skipping', { mayarProductId, status: data?.status });
        res.status(200).json({ received: true });
        return;
      }

      // 4. Mark payment as PAID; only advance to CONFIRMED if still pending — never
      //    revert an already-active or completed booking when a remainder payment arrives.
      await paymentRepository.updateStatus(payment.id, 'PAID', mayarTransactionId);
      if (booking.status === 'PENDING_PAYMENT') {
        await bookingRepository.updateStatus(booking.merchant_id, booking.id, 'CONFIRMED');
      }

      // 5. Send confirmation email with real asset and merchant names
      const [detailed, customer, merchant] = await Promise.all([
        bookingRepository.findByIdPublicDetailed(booking.id),
        customerRepository.findById(booking.merchant_id, booking.customer_id),
        merchantRepository.findById(booking.merchant_id),
      ]);

      if (customer) {
        await notificationService.sendBookingConfirmation(customer.email, {
          customerName: customer.name,
          bookingId: booking.id,
          assetName: (detailed?.asset_name as string) ?? 'Your rental',
          startTime: booking.start_time,
          endTime: booking.end_time,
          totalPrice: booking.total_price,
          upfrontFee: booking.upfront_fee,
          merchantName: merchant?.name ?? '',
        });
      }
    }

    res.status(200).json({ received: true });
  },
};
