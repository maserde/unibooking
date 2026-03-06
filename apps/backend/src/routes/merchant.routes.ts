import { Router } from 'express';
import { merchantController } from '../controllers/merchant.controller';
import { authMerchant } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { updateProfileSchema, paymentSetupSchema } from '../validators/merchant.validator';

const router = Router();

router.use(authMerchant);

router.get('/profile', merchantController.getProfile);
router.put('/profile', requireRole('OWNER', 'ADMIN'), validate(updateProfileSchema), merchantController.updateProfile);
router.put('/payment-setup', requireRole('OWNER'), validate(paymentSetupSchema), merchantController.setupPayment);

export default router;
