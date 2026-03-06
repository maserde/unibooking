import { Router } from 'express';
import { bookingsController } from '../controllers/bookings.controller';
import { authMerchant } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { updateBookingStatusSchema } from '../validators/booking.validator';

const router = Router();

router.use(authMerchant);

router.get('/', bookingsController.list);
router.get('/:id', bookingsController.detail);
router.patch('/:id/status', requireRole('OWNER', 'ADMIN', 'STAFF'), validate(updateBookingStatusSchema), bookingsController.updateStatus);

export default router;
