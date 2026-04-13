import { type ConnectionOptions, Queue } from 'bullmq';

import { getRedisConnection } from '../index';

export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
}

let emailQueue: Queue<EmailJobData> | null = null;

export function getEmailQueue(): Queue<EmailJobData> | null {
  return emailQueue;
}

export function createEmailQueue(): Queue<EmailJobData> | null {
  const connection = getRedisConnection();
  if (!connection) return null;

  emailQueue = new Queue<EmailJobData>('email', {
    connection: connection as ConnectionOptions,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    },
  });

  return emailQueue;
}

export async function addEmailJob(data: EmailJobData): Promise<void> {
  if (!emailQueue) {
    console.warn('Email queue not initialized, skipping job');
    return;
  }
  await emailQueue.add('send-email', data);
}
