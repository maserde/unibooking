import { Router } from 'express';
import authRoutes from './auth.routes';
import merchantRoutes from './merchant.routes';
import assetsRoutes from './assets.routes';
import bookingsRoutes from './bookings.routes';
import customersRoutes from './customers.routes';
import promosRoutes from './promos.routes';
import staffRoutes from './staff.routes';
import dashboardRoutes from './dashboard.routes';
import publicRoutes from './public.routes';
import customerPortalRoutes from './customerPortal.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/merchant', merchantRoutes);
router.use('/merchant', assetsRoutes);
router.use('/merchant/bookings', bookingsRoutes);
router.use('/merchant/customers', customersRoutes);
router.use('/merchant/promos', promosRoutes);
router.use('/merchant/staff', staffRoutes);
router.use('/merchant/dashboard', dashboardRoutes);
router.use('/public', publicRoutes);
router.use('/customer', customerPortalRoutes);

export default router;
