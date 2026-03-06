import { Router } from 'express';
import { customerPortalController } from '../controllers/customerPortal.controller';
import { authCustomer } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter.middleware';
import { validate } from '../middleware/validate.middleware';
import { z } from 'zod';

const requestMagicLinkSchema = z.object({
  email: z.string().email(),
  merchant_slug: z.string().min(1),
});

const router = Router();

router.post('/auth/request-magic-link', authLimiter, validate(requestMagicLinkSchema), customerPortalController.requestMagicLink);
router.get('/auth/verify/:token', customerPortalController.verifyMagicLink);

router.get('/bookings', authCustomer, customerPortalController.getBookings);
router.get('/bookings/:id', authCustomer, customerPortalController.getBookingDetail);

export default router;
