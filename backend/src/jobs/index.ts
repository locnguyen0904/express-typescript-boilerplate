import { Queue, Worker } from 'bullmq';
import IORedis, { RedisOptions } from 'ioredis';

import { config } from '@/config';
import { redisService } from '@/container';
import { logger } from '@/services';

import { createEmailQueue } from './queues/email.queue';
import { closeEmailWorker, createEmailWorker } from './workers/email.worker';

let redisConnection: IORedis | null = null;

const queues: Queue[] = [];
const workers: Worker[] = [];

export function getRedisConnection(): IORedis | null {
  return redisConnection;
}

export async function initializeJobs(): Promise<void> {
  if (!config.features.jobsEnabled) {
    logger.info('Jobs disabled via JOBS_ENABLED=false');
    return;
  }

  if (!redisService.isConnected || !redisService.instance) {
    logger.warn('Redis not connected, job queues disabled');
    return;
  }

  // Create a dedicated connection for BullMQ (separate from cache)
  const existingOptions = redisService.instance.options as RedisOptions;
  redisConnection = new IORedis({
    host: existingOptions.host,
    port: existingOptions.port,
    password: existingOptions.password,
    db: existingOptions.db,
    username: existingOptions.username,
    maxRetriesPerRequest: null, // Required by BullMQ
  });

  // Create queues
  const emailQueue = createEmailQueue();
  if (emailQueue) queues.push(emailQueue);

  // Create workers
  const emailWorker = createEmailWorker();
  if (emailWorker) workers.push(emailWorker);

  logger.info(
    `Job system initialized: ${queues.length} queue(s), ${workers.length} worker(s)`
  );
}

export async function shutdownJobs(): Promise<void> {
  await closeEmailWorker();

  for (const queue of queues) {
    await queue.close();
  }

  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
  }

  queues.length = 0;
  workers.length = 0;
}

export function getQueues(): Queue[] {
  return queues;
}
