import { Router } from 'express';
import { customersController } from '../controllers/customers.controller';
import { authMerchant } from '../middleware/auth.middleware';

const router = Router();

router.use(authMerchant);

router.get('/', customersController.list);
router.get('/:id', customersController.detail);

export default router;
