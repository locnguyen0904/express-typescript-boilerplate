import mongoose from 'mongoose';

import logger from '@/services/logger.service';
import { connectDB, disconnectDB } from '@/services/mongoose.service';

// mongoose is local-logic heavy, keep structural mock here
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  set: jest.fn(),
  connection: {
    on: jest.fn(),
  },
}));

describe('MongooseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('connectDB', () => {
    it('should connect to MongoDB successfully', async () => {
      (mongoose.connect as jest.Mock).mockResolvedValue(undefined);
      await connectDB();
      expect(mongoose.connect).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
    });

    it('should throw error on failure', async () => {
      const error = new Error('Fail');
      (mongoose.connect as jest.Mock).mockRejectedValue(error);
      await expect(connectDB()).rejects.toThrow('Fail');
    });
  });

  describe('disconnectDB', () => {
    it('should disconnect successfully', async () => {
      (mongoose.disconnect as jest.Mock).mockResolvedValue(undefined);
      await disconnectDB();
      expect(mongoose.disconnect).toHaveBeenCalled();
    });
  });
});
