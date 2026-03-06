import type { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { successResponse } from '../utils/apiResponse';

export const dashboardController = {
  async getStats(req: Request, res: Response): Promise<void> {
    const stats = await dashboardService.getStats(req.merchantId!);
    successResponse(res, stats);
  },
};
