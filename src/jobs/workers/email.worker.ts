import { type ConnectionOptions, Job, Worker } from 'bullmq';

import { logger } from '@/services';

import { getRedisConnection } from '../index';
import { EmailJobData } from '../queues/email.queue';

let emailWorker: Worker<EmailJobData> | null = null;

export async function processEmail(job: Job<EmailJobData>): Promise<void> {
  const { to, subject } = job.data;

  // TODO: Implement actual email sending (e.g., nodemailer, SendGrid, SES).
  // Currently logs the email data for debugging. No email is sent.
  logger.info(
    `[Email Worker] Placeholder — email not sent. to=${to} subject="${subject}"`
  );

  // Simulate email sending delay
  await new Promise((resolve) => setTimeout(resolve, 100));
}

export function createEmailWorker(): Worker<EmailJobData> | null {
  const connection = getRedisConnection();
  if (!connection) return null;

  emailWorker = new Worker<EmailJobData>('email', processEmail, {
    connection: connection as ConnectionOptions,
    concurrency: 5,
  });

  emailWorker.on('completed', (job) => {
    logger.info(`[Email Worker] Job ${job.id} completed`);
  });

  emailWorker.on('failed', (job, err) => {
    logger.error(`[Email Worker] Job ${job?.id} failed: ${err.message}`);
  });

  return emailWorker;
}

export async function closeEmailWorker(): Promise<void> {
  if (emailWorker) {
    await emailWorker.close();
    emailWorker = null;
  }
}
