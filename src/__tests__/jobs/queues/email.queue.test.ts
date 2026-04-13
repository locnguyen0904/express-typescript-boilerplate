import { Queue } from 'bullmq';

import * as index from '@/jobs/index';
import {
  addEmailJob,
  createEmailQueue,
  EmailJobData,
} from '@/jobs/queues/email.queue';

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'mock-job' }),
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@/jobs/index');

describe('EmailQueue', () => {
  const mockRedisClient = { host: 'localhost' };

  beforeEach(() => {
    jest.clearAllMocks();
    (index.getRedisConnection as jest.Mock).mockReturnValue(mockRedisClient);
  });

  describe('createEmailQueue', () => {
    it('should create and return a BullMQ Queue', () => {
      const queue = createEmailQueue();

      expect(queue).toBeDefined();
      expect(Queue).toHaveBeenCalledWith(
        'email',
        expect.objectContaining({ connection: mockRedisClient })
      );
    });
  });

  describe('addEmailJob', () => {
    it('should add a job to the queue if initialized', async () => {
      const queue = createEmailQueue();
      const emailData: EmailJobData = {
        to: 'test@example.com',
        subject: 'Hello',
        body: 'World',
      };

      await addEmailJob(emailData);
      expect(queue?.add).toHaveBeenCalledWith('send-email', emailData);
    });
  });
});
