import { Router } from 'express';
import multer from 'multer';
import { merchantController } from '../controllers/merchant.controller';
import { authMerchant } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { updateProfileSchema, paymentSetupSchema } from '../validators/merchant.validator';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authMerchant);

router.get('/profile', merchantController.getProfile);
router.put('/profile', requireRole('OWNER', 'ADMIN'), validate(updateProfileSchema), merchantController.updateProfile);
router.post('/logo', requireRole('OWNER', 'ADMIN'), upload.single('logo'), merchantController.uploadLogo);
router.put('/payment-setup', requireRole('OWNER'), validate(paymentSetupSchema), merchantController.setupPayment);
router.get('/webhook', merchantController.getWebhookInfo);
router.post('/webhook/retry', requireRole('OWNER'), merchantController.retryWebhookRegister);

export default router;
