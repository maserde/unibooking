import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { renderEmail } from '../utils/renderEmail';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

/**
 * Renders the template and sends the email. All errors (rendering + SMTP)
 * are caught here so that a failed email never breaks the calling service.
 */
async function sendMail(
  to: string,
  subject: string,
  template: string,
  vars: Record<string, string>,
): Promise<void> {
  try {
    const html = renderEmail(template, vars);
    await transporter.sendMail({ from: env.SMTP_FROM, to, subject, html });
    logger.info('Email sent', { to, subject });
  } catch (err) {
    logger.error('Failed to send email', { to, subject, template, err });
    // Non-blocking: don't throw, just log
  }
}

export const notificationService = {
  async sendVerificationEmail(email: string, token: string, name: string): Promise<void> {
    const link = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    await sendMail(email, 'Verifikasi akun BookingAja Anda', 'verify-email', { name, link });
  },

  async sendMagicLink(email: string, token: string, merchantSlug: string): Promise<void> {
    const link = `${env.FRONTEND_URL}/customer/${merchantSlug}/verify/${token}`;
    await sendMail(email, 'Link masuk BookingAja Anda', 'magic-link', { link });
  },

  async sendBookingCreated(
    email: string,
    details: {
      customerName: string;
      bookingId: string;
      assetName: string;
      startTime: Date;
      endTime: Date;
      totalPrice: number;
      upfrontFee: number;
      paymentLink: string | null;
      merchantName: string;
      merchantSlug: string;
      magicLinkToken: string;
    },
  ): Promise<void> {
    const portalUrl = `${env.FRONTEND_URL}/customer/${details.merchantSlug}`;
    const magicLink = `${env.FRONTEND_URL}/customer/${details.merchantSlug}/verify/${details.magicLinkToken}`;
    await sendMail(email, `Pemesanan Diterima – ${details.merchantName}`, 'booking-created', {
      customerName: details.customerName,
      merchantName: details.merchantName,
      assetName: details.assetName,
      startTime: details.startTime.toLocaleString('id-ID'),
      endTime: details.endTime.toLocaleString('id-ID'),
      totalPrice: `Rp ${details.totalPrice.toLocaleString('id-ID')}`,
      upfrontFee: `Rp ${details.upfrontFee.toLocaleString('id-ID')}`,
      paymentLink: details.paymentLink ?? '',
      magicLink,
      portalUrl,
    });
  },

  async sendBookingConfirmation(
    email: string,
    bookingDetails: {
      customerName: string;
      bookingId: string;
      assetName: string;
      startTime: Date;
      endTime: Date;
      totalPrice: number;
      upfrontFee: number;
      merchantName: string;
    },
  ): Promise<void> {
    await sendMail(email, `Pemesanan Dikonfirmasi – ${bookingDetails.merchantName}`, 'booking-confirmed', {
      customerName: bookingDetails.customerName,
      merchantName: bookingDetails.merchantName,
      assetName: bookingDetails.assetName,
      startTime: bookingDetails.startTime.toLocaleString('id-ID'),
      endTime: bookingDetails.endTime.toLocaleString('id-ID'),
      totalPrice: `Rp ${bookingDetails.totalPrice.toLocaleString('id-ID')}`,
      upfrontFee: `Rp ${bookingDetails.upfrontFee.toLocaleString('id-ID')}`,
      bookingId: bookingDetails.bookingId,
    });
  },

  async sendBookingStatusUpdate(
    email: string,
    customerName: string,
    bookingId: string,
    status: string,
    merchantName: string,
  ): Promise<void> {
    await sendMail(email, `Pembaruan Pemesanan – ${merchantName}`, 'booking-status-update', {
      customerName,
      bookingId,
      status,
      merchantName,
    });
  },

  async sendRemainderPayment(
    email: string,
    details: {
      customerName: string;
      merchantName: string;
      assetName: string;
      bookingId: string;
      remainderAmount: number;
      paymentLink: string;
    },
  ): Promise<void> {
    await sendMail(email, `Sisa Pembayaran – ${details.merchantName}`, 'remainder-payment', {
      customerName: details.customerName,
      merchantName: details.merchantName,
      assetName: details.assetName,
      bookingId: details.bookingId,
      remainderAmount: `Rp ${details.remainderAmount.toLocaleString('id-ID')}`,
      paymentLink: details.paymentLink,
    });
  },

  async sendStaffInvitation(
    email: string,
    fullName: string,
    tempPassword: string,
    merchantName: string,
  ): Promise<void> {
    const loginUrl = `${env.FRONTEND_URL}/login`;
    await sendMail(email, `Anda diundang bergabung ke ${merchantName} di BookingAja`, 'staff-invitation', {
      fullName,
      merchantName,
      email,
      tempPassword,
      loginUrl,
    });
  },
};