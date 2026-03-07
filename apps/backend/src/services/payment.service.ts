import axios from 'axios';
import { paymentRepository } from '../repositories/payment.repository';
import { encryptionService } from './encryption.service';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../config/logger';
import { env, MAYAR_BASE_URL } from '../config/env';
import type { Payment } from '../types/models';

export const paymentService = {
  async createPaymentLink(
    merchantId: string,
    bookingId: string,
    amount: number,
    description: string,
    customerEmail: string,
    customerPhone: string,
  ): Promise<Payment> {
    const apiKey = await encryptionService.getMerchantApiKey(merchantId);

    let paymentLink: string | undefined;
    let mayarTransactionId: string | undefined;

    try {
      const response = await axios.post(
        `${MAYAR_BASE_URL}/payment/create`,
        {
          name: description,
          email: customerEmail,
          amount,
          mobile: customerPhone,
          redirectUrl: `${env.FRONTEND_URL}/customer/bookings/${bookingId}`,
          expiredAt: new Date(Date.now() + 15 * 60 * 1000),
          description: `Booking ${bookingId}`,
        },
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 15000,
        },
      );

      const data = response.data?.data;
      paymentLink = data?.link;
      mayarTransactionId = data?.id;
    } catch (err) {
      logger.error('Mayar payment link creation failed', { err });
      throw new AppError('Failed to create payment link. Please try again.', 502);
    }

    return paymentRepository.create({
      bookingId,
      amount,
      mayarTransactionId,
      paymentLink,
    });
  },
};
