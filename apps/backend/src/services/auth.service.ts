import crypto from 'crypto';
import { merchantRepository } from '../repositories/merchant.repository';
import { merchantUserRepository } from '../repositories/merchantUser.repository';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { signMerchantToken, verifyToken, decodeTokenExpiry, type MerchantTokenPayload } from '../utils/jwt';
import { redis } from '../config/redis';
import { notificationService } from './notification.service';
import { AppError } from '../middleware/error.middleware';
import { generateSlug } from '../utils/slug';

export const authService = {
  async register(data: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<{ message: string }> {
    const existing = await merchantUserRepository.findByEmail(data.email);
    if (existing) throw new AppError('Email sudah terdaftar', 409);

    // Create merchant with slug derived from owner name (can be updated later)
    let slug = generateSlug(data.fullName);
    let attempt = 0;
    while (await merchantRepository.isSlugTaken(slug)) {
      attempt++;
      slug = `${generateSlug(data.fullName)}-${attempt}`;
    }

    const merchant = await merchantRepository.create({ name: data.fullName, slug });
    const passwordHash = await hashPassword(data.password);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    await merchantUserRepository.create({
      merchantId: merchant.id,
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      role: 'OWNER',
      emailVerificationToken: verificationToken,
    });

    await notificationService.sendVerificationEmail(data.email, verificationToken, data.fullName);

    return { message: 'Pendaftaran berhasil. Silakan verifikasi email Anda.' };
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await merchantUserRepository.findByVerificationToken(token);
    if (!user) throw new AppError('Token verifikasi tidak valid atau kedaluwarsa', 400);
    await merchantUserRepository.markEmailVerified(user.id);
    return { message: 'Email berhasil diverifikasi. Silakan masuk.' };
  },

  async login(email: string, password: string): Promise<{ token: string; user: object }> {
    const user = await merchantUserRepository.findByEmail(email);
    if (!user) throw new AppError('Email atau kata sandi salah', 401);
    if (!user.is_email_verified) throw new AppError('Silakan verifikasi email Anda sebelum masuk', 403);

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) throw new AppError('Email atau kata sandi salah', 401);

    const token = signMerchantToken({
      sub: user.id,
      merchantId: user.merchant_id,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        merchant_id: user.merchant_id,
      },
    };
  },

  async logout(token: string): Promise<void> {
    const payload = verifyToken(token) as MerchantTokenPayload;
    const exp = decodeTokenExpiry(token);
    const ttl = exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await redis.setex(`blacklist:${payload.jti}`, ttl, '1');
    }
  },
};
