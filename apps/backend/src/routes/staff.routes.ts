import { Router } from 'express';
import { staffController } from '../controllers/staff.controller';
import { authMerchant } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { inviteStaffSchema, updateStaffSchema } from '../validators/merchant.validator';

const router = Router();

router.use(authMerchant);
router.use(requireRole('OWNER'));

router.get('/', staffController.list);
router.post('/', validate(inviteStaffSchema), staffController.invite);
router.put('/:id', validate(updateStaffSchema), staffController.update);
router.delete('/:id', staffController.remove);

export default router;
