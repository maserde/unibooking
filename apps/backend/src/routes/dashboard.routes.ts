import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authMerchant } from '../middleware/auth.middleware';

const router = Router();

router.use(authMerchant);
router.get('/stats', dashboardController.getStats);

export default router;
