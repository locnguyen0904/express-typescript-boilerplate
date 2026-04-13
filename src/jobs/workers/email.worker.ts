import { type ConnectionOptions, Job, Worker } from 'bullmq';

import { getRedisConnection } from '../index';
import { EmailJobData } from '../queues/email.queue';

let emailWorker: Worker<EmailJobData> | null = null;

async function processEmail(job: Job<EmailJobData>): Promise<void> {
  const { to, subject } = job.data;

  // TODO: Replace with actual email sending logic (e.g., nodemailer, SendGrid, SES)
  console.log(`[Email Worker] Sending email to=${to} subject="${subject}"`);

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
    console.log(`[Email Worker] Job ${job.id} completed`);
  });

  emailWorker.on('failed', (job, err) => {
    console.error(`[Email Worker] Job ${job?.id} failed: ${err.message}`);
  });

  return emailWorker;
}

export async function closeEmailWorker(): Promise<void> {
  if (emailWorker) {
    await emailWorker.close();
    emailWorker = null;
  }
}
