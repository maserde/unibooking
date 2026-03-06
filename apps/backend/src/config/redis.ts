import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

redis.on('connect', () => logger.info('Redis connection established'));
redis.on('error', (err) => logger.error('Redis error', { err }));

export async function connectRedis(): Promise<void> {
  await redis.connect();
}
