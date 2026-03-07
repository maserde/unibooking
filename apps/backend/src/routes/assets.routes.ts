import { Router } from 'express';
import multer from 'multer';
import { assetsController } from '../controllers/assets.controller';
import { authMerchant } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createAssetSchema,
  updateAssetSchema,
  createUnitSchema,
  updateUnitSchema,
  initialCatalogSchema,
} from '../validators/asset.validator';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authMerchant);

router.post('/catalog/initial-setup', requireRole('OWNER'), validate(initialCatalogSchema), assetsController.initialCatalogSetup);
router.get('/assets', assetsController.listAssets);
router.post('/assets', requireRole('OWNER', 'ADMIN'), validate(createAssetSchema), assetsController.createAsset);
router.put('/assets/:id', requireRole('OWNER', 'ADMIN'), validate(updateAssetSchema), assetsController.updateAsset);
router.delete('/assets/:id', requireRole('OWNER', 'ADMIN'), assetsController.deleteAsset);

router.post('/assets/:id/images', requireRole('OWNER', 'ADMIN'), upload.single('image'), assetsController.uploadImage);
router.delete('/assets/:id/images/:imageId', requireRole('OWNER', 'ADMIN'), assetsController.deleteImage);

router.get('/assets/:id/units', assetsController.listUnits);
router.post('/assets/:id/units', requireRole('OWNER', 'ADMIN'), validate(createUnitSchema), assetsController.addUnit);
router.put('/units/:id', requireRole('OWNER', 'ADMIN'), validate(updateUnitSchema), assetsController.updateUnit);
router.delete('/units/:id', requireRole('OWNER', 'ADMIN'), assetsController.deleteUnit);

export default router;
