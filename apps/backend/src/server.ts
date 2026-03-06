import './config/env'; // Validate env first
import app from './app';
import { env } from './config/env';
import { testConnection } from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './config/logger';

async function main(): Promise<void> {
  // Connect to dependencies
  await testConnection();
  await connectRedis();

  // Start server
  const server = app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`, {
      env: env.NODE_ENV,
      port: env.PORT,
    });
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('Failed to start server', { err });
  process.exit(1);
});
