import http from 'http';

import config from '@/config/env.config';
import { redisService } from '@/container';

import app from './app';
import { initializeJobs, shutdownJobs } from './jobs';
import { logger, mongoose } from './services';

const PORT = config.port || 3000;
const SHUTDOWN_TIMEOUT = 30000;

async function gracefulShutdown(
  server: http.Server,
  signal: string
): Promise<void> {
  logger.info(`${signal} received: starting graceful shutdown`);

  try {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) return reject(err);
        logger.info('HTTP server closed');
        resolve();
      });
    });

    await Promise.all([
      shutdownJobs(),
      mongoose.disconnectDB(),
      redisService.disconnect(),
    ]);

    logger.info('All connections closed gracefully');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during graceful shutdown');
    process.exit(1);
  }
}

function initGracefulShutdown(server: http.Server): void {
  let isShuttingDown = false;

  const shutdown = (signal: string) => {
    if (isShuttingDown) {
      logger.warn(`${signal} received again, shutdown already in progress`);
      return;
    }
    isShuttingDown = true;

    const timeout = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT);
    timeout.unref();

    gracefulShutdown(server, signal);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

async function bootstrap(): Promise<void> {
  try {
    await mongoose.connectDB();
    await redisService.connect();

    if (config.features.jobsEnabled) {
      await initializeJobs();
    } else {
      logger.info('Skipping job initialization because JOBS_ENABLED=false');
    }

    const server = http.createServer(app);
    initGracefulShutdown(server);

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection');
});

process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught Exception');
  process.exit(1);
});

bootstrap();
