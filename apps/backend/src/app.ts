import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';
import { generalLimiter } from './middleware/rateLimiter.middleware';
import { webhookController } from './controllers/webhook.controller';
import apiRoutes from './routes/index';

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: [env.FRONTEND_URL],
    credentials: true,
  }),
);

// Request logging
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ⚠️ Webhook route MUST be registered BEFORE express.json()
// It needs raw body for HMAC verification
app.post(
  '/api/webhooks/mayar',
  express.raw({ type: 'application/json' }),
  webhookController.handleMayar,
);

// JSON body parser for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// General rate limiter
app.use('/api', generalLimiter);

// API routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
