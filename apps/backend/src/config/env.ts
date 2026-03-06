import path from 'path';
import { z } from 'zod';
import dotenv from 'dotenv';

// Resolve .env relative to this file's location (src/config/) → apps/backend/.env
// Works correctly regardless of process.cwd() when running from monorepo root.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),

  DB_HOST: z.string().min(1),
  DB_PORT: z.string().default('3306').transform(Number),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),

  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.string().default('6379').transform(Number),
  REDIS_PASSWORD: z.string().min(1),

  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_CUSTOMER_EXPIRES_IN: z.string().default('24h'),

  AES_SECRET_KEY: z.string().min(32),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.string().default('587').transform(Number),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().min(1),

  APP_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),

  MAYAR_WEBHOOK_SECRET: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
