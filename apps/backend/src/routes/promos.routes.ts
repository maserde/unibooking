import { Router } from 'express';
import { promosController } from '../controllers/promos.controller';
import { authMerchant } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { createPromoSchema, updatePromoSchema } from '../validators/promo.validator';

const router = Router();

router.use(authMerchant);
router.use(requireRole('OWNER', 'ADMIN'));

router.get('/', promosController.list);
router.post('/', validate(createPromoSchema), promosController.create);
router.put('/:id', validate(updatePromoSchema), promosController.update);
router.delete('/:id', promosController.delete);

export default router;
