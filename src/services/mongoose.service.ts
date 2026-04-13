import mongoose from 'mongoose';

import { config } from '@/config';

import logger from './logger.service';

const MONGODB_OPTIONS: mongoose.ConnectOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

mongoose.set('toJSON', {
  virtuals: true,
  versionKey: false,
});

mongoose.set('toObject', {
  virtuals: true,
});

export const connectDB = async (): Promise<void> => {
  const startTime = Date.now();

  try {
    await mongoose.connect(config.mongodb.url, MONGODB_OPTIONS);

    const connectionTime = Date.now() - startTime;
    logger.info(`MongoDB connected successfully in ${connectionTime}ms`);

    mongoose.connection.on('error', (error) => {
      logger.error({ error }, 'MongoDB connection error');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error) {
    logger.error({ error }, 'MongoDB initial connection error');
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully');
  } catch (error) {
    logger.error({ error }, 'Error disconnecting from MongoDB');
    throw error;
  }
};
