import type { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { merchantUserRepository } from '../repositories/merchantUser.repository';
import { merchantRepository } from '../repositories/merchant.repository';
import { successResponse } from '../utils/apiResponse';
import { env } from '../config/env';
import { AppError } from '../middleware/error.middleware';

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register({
      email: req.body.email,
      password: req.body.password,
      fullName: req.body.full_name,
    });
    successResponse(res, null, result.message, 201);
  },

  async verifyEmail(req: Request, res: Response): Promise<void> {
    const token = req.query.token as string;
    if (!token) throw new AppError('Token is required', 400);
    const result = await authService.verifyEmail(token);
    successResponse(res, null, result.message);
  },

  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body.email, req.body.password);
    successResponse(res, result);
  },

  async logout(req: Request, res: Response): Promise<void> {
    const token = req.headers.authorization!.slice(7);
    await authService.logout(token);
    successResponse(res, null, 'Logged out successfully');
  },

  async me(req: Request, res: Response): Promise<void> {
    const user = await merchantUserRepository.findById(req.merchantUser!.id);
    if (!user) throw new AppError('User not found', 404);
    const merchant = await merchantRepository.findById(user.merchant_id);
    const { password_hash: _, email_verification_token: __, ...safeUser } = user;
    const merchantWithUrl = merchant
      ? { ...merchant, storefront_url: `${env.FRONTEND_URL}/store/${merchant.slug}` }
      : merchant;
    successResponse(res, { user: safeUser, merchant: merchantWithUrl });
  },
};
