import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authMerchant } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.get('/verify-email', authController.verifyEmail);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authMerchant, authController.logout);
router.get('/me', authMerchant, authController.me);

export default router;
