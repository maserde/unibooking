import type { Request, Response } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import { paymentRepository } from '../repositories/payment.repository';
import { bookingRepository } from '../repositories/booking.repository';
import { customerRepository } from '../repositories/customer.repository';
import { notificationService } from '../services/notification.service';
import { logger } from '../config/logger';
import { AppError } from '../middleware/error.middleware';

export const webhookController = {
  async handleMayar(req: Request, res: Response): Promise<void> {
    // Verify HMAC signature
    const signature = req.headers['x-mayar-signature'] as string;
    if (!signature) throw new AppError('Missing signature', 401);

    const rawBody = req.body as Buffer;
    const hmac = crypto
      .createHmac('sha256', env.MAYAR_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    const sigBuffer = Buffer.from(signature);
    const hmacBuffer = Buffer.from(hmac);

    if (sigBuffer.length !== hmacBuffer.length || !crypto.timingSafeEqual(sigBuffer, hmacBuffer)) {
      throw new AppError('Invalid signature', 401);
    }

    const payload = JSON.parse(rawBody.toString('utf8'));
    logger.info('Mayar webhook received', { event: payload.event, id: payload.data?.id });

    const { event, data } = payload;

    if (event === 'payment.paid') {
      const mayarTransactionId = data?.id;
      const mayarPaymentLink = data?.link;

      // Find payment by transaction ID or payment link
      let payment = await paymentRepository.findByMayarTransactionId(mayarTransactionId);

      if (!payment && mayarPaymentLink) {
        // Fallback: try to find by booking_id from external reference
        const bookingId = data?.description?.replace('Booking ', '');
        if (bookingId) {
          payment = await paymentRepository.findByBookingId(bookingId);
        }
      }

      if (!payment) {
        logger.warn('Webhook: payment record not found', { mayarTransactionId });
        res.status(200).json({ received: true });
        return;
      }

      await paymentRepository.updateStatus(payment.id, 'PAID', mayarTransactionId);

      const booking = await bookingRepository.findByIdPublic(payment.booking_id);
      if (!booking) {
        res.status(200).json({ received: true });
        return;
      }

      await bookingRepository.updateStatus(booking.merchant_id, booking.id, 'CONFIRMED');

      // Send confirmation email
      const customer = await customerRepository.findById(booking.merchant_id, booking.customer_id);
      if (customer) {
        await notificationService.sendBookingConfirmation(customer.email, {
          customerName: customer.name,
          bookingId: booking.id,
          assetName: 'Your rental',
          startTime: booking.start_time,
          endTime: booking.end_time,
          totalPrice: booking.total_price,
          upfrontFee: booking.upfront_fee,
          merchantName: '',
        });
      }
    }

    res.status(200).json({ received: true });
  },
};
