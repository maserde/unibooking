import type { Request, Response } from 'express';
import { merchantUserRepository } from '../repositories/merchantUser.repository';
import { hashPassword } from '../utils/bcrypt';
import { generateUuid } from '../utils/uuid';
import { successResponse } from '../utils/apiResponse';
import { AppError } from '../middleware/error.middleware';
import crypto from 'crypto';

export const staffController = {
  async list(req: Request, res: Response): Promise<void> {
    const users = await merchantUserRepository.findByMerchantId(req.merchantId!);
    const safe = users.map(({ password_hash: _, email_verification_token: __, ...u }) => u);
    successResponse(res, safe);
  },

  async invite(req: Request, res: Response): Promise<void> {
    const existing = await merchantUserRepository.findByEmail(req.body.email);
    if (existing) throw new AppError('Email already registered', 409);

    const passwordHash = await hashPassword(req.body.password);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await merchantUserRepository.create({
      merchantId: req.merchantId!,
      email: req.body.email,
      passwordHash,
      fullName: req.body.full_name,
      role: req.body.role,
      emailVerificationToken: verificationToken,
    });

    const { password_hash: _, email_verification_token: __, ...safe } = user;
    successResponse(res, safe, 'Staff member invited', 201);
  },

  async update(req: Request, res: Response): Promise<void> {
    // Prevent modifying the owner
    const target = await merchantUserRepository.findById(req.params.id);
    if (!target || target.merchant_id !== req.merchantId) {
      throw new AppError('Staff member not found', 404);
    }
    if (target.role === 'OWNER') throw new AppError('Cannot modify the owner account', 403);

    await merchantUserRepository.update(req.params.id, req.merchantId!, req.body);
    const updated = await merchantUserRepository.findById(req.params.id);
    const { password_hash: _, email_verification_token: __, ...safe } = updated!;
    successResponse(res, safe);
  },

  async remove(req: Request, res: Response): Promise<void> {
    const target = await merchantUserRepository.findById(req.params.id);
    if (!target || target.merchant_id !== req.merchantId) {
      throw new AppError('Staff member not found', 404);
    }
    if (target.role === 'OWNER') throw new AppError('Cannot remove the owner account', 403);
    if (target.id === req.merchantUser!.id) throw new AppError('Cannot remove yourself', 403);

    await merchantUserRepository.delete(req.params.id, req.merchantId!);
    successResponse(res, null, 'Staff member removed');
  },
};
