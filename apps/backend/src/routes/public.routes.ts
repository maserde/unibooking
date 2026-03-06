import { Router } from 'express';
import { publicController } from '../controllers/public.controller';
import { publicLimiter } from '../middleware/rateLimiter.middleware';
import { validate } from '../middleware/validate.middleware';
import { createBookingSchema } from '../validators/booking.validator';
import { validatePromoSchema } from '../validators/promo.validator';

const router = Router();

router.use(publicLimiter);

router.get('/:slug/catalog', publicController.getCatalog);
router.get('/:slug/assets/:assetId/availability', publicController.checkAvailability);
router.post('/:slug/bookings', validate(createBookingSchema), publicController.createBooking);
router.post('/:slug/promos/validate', validate(validatePromoSchema), publicController.validatePromo);

export default router;
