import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

async function sendMail(to: string, subject: string, html: string): Promise<void> {
  try {
    await transporter.sendMail({ from: env.SMTP_FROM, to, subject, html });
    logger.info('Email sent', { to, subject });
  } catch (err) {
    logger.error('Failed to send email', { to, subject, err });
    // Non-blocking: don't throw, just log
  }
}

export const notificationService = {
  async sendVerificationEmail(email: string, token: string, name: string): Promise<void> {
    const link = `${env.APP_URL}/api/auth/verify-email?token=${token}`;
    await sendMail(
      email,
      'Verify your Unibooking account',
      `<p>Hi ${name},</p>
       <p>Please verify your email by clicking the link below:</p>
       <p><a href="${link}">${link}</a></p>
       <p>This link is valid for 24 hours.</p>`,
    );
  },

  async sendMagicLink(email: string, token: string, merchantSlug: string): Promise<void> {
    const link = `${env.FRONTEND_URL}/customer/${merchantSlug}/verify/${token}`;
    await sendMail(
      email,
      'Your Unibooking login link',
      `<p>Click the link below to access your booking history. This link expires in 15 minutes.</p>
       <p><a href="${link}">${link}</a></p>`,
    );
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
    await sendMail(
      email,
      `Booking Confirmed – ${bookingDetails.merchantName}`,
      `<p>Hi ${bookingDetails.customerName},</p>
       <p>Your booking has been confirmed!</p>
       <p><strong>Item:</strong> ${bookingDetails.assetName}</p>
       <p><strong>From:</strong> ${bookingDetails.startTime.toLocaleString()}</p>
       <p><strong>To:</strong> ${bookingDetails.endTime.toLocaleString()}</p>
       <p><strong>Total:</strong> Rp ${bookingDetails.totalPrice.toLocaleString()}</p>
       <p><strong>Paid (upfront):</strong> Rp ${bookingDetails.upfrontFee.toLocaleString()}</p>
       <p>Booking ID: ${bookingDetails.bookingId}</p>`,
    );
  },

  async sendBookingStatusUpdate(
    email: string,
    customerName: string,
    bookingId: string,
    status: string,
    merchantName: string,
  ): Promise<void> {
    await sendMail(
      email,
      `Booking Update – ${merchantName}`,
      `<p>Hi ${customerName},</p>
       <p>Your booking <strong>${bookingId}</strong> status has been updated to: <strong>${status}</strong>.</p>`,
    );
  },
};
