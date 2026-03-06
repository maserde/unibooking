import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller';

const router = Router();

// Raw body parsing is configured in app.ts for /api/webhooks
router.post('/mayar', webhookController.handleMayar);

export default router;
