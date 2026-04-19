import { Worker } from 'bullmq';

import * as index from '@/jobs/index';
import {
  closeEmailWorker,
  createEmailWorker,
  processEmail,
} from '@/jobs/workers/email.worker';
import { logger } from '@/services';

jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@/jobs/index');

describe('EmailWorker', () => {
  const mockRedisClient = { host: 'localhost' };

  beforeEach(() => {
    jest.clearAllMocks();
    (index.getRedisConnection as jest.Mock).mockReturnValue(mockRedisClient);
  });

  describe('processEmail', () => {
    it('should process the email job and log the email body including the reset link', async () => {
      const job = {
        data: {
          to: 'test@example.com',
          subject: 'Reset Password',
          body: 'Reset link here',
        },
      } as any;

      const loggerSpy = jest.spyOn(logger, 'info').mockImplementation();

      await processEmail(job);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sending email to=test@example.com')
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('body="Reset link here"')
      );

      loggerSpy.mockRestore();
    });
  });

  describe('createEmailWorker', () => {
    it('should create and return a BullMQ Worker', () => {
      const worker = createEmailWorker();

      expect(worker).toBeDefined();
      expect(Worker).toHaveBeenCalledWith(
        'email',
        expect.any(Function),
        expect.objectContaining({ connection: mockRedisClient })
      );
    });

    it('should attach event listeners', () => {
      const worker = createEmailWorker();

      expect(worker?.on).toHaveBeenCalledWith(
        'completed',
        expect.any(Function)
      );
      expect(worker?.on).toHaveBeenCalledWith('failed', expect.any(Function));
    });
  });

  describe('closeEmailWorker', () => {
    it('should close the worker if it exists', async () => {
      const worker = createEmailWorker();
      await closeEmailWorker();
      expect(worker?.close).toHaveBeenCalled();
    });
  });
});
