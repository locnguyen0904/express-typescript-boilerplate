import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { config } from '@/config';
import * as schema from '@/db/schema';

import logger from './logger.service';

const pool = new Pool({
  connectionString: config.database.url,
  max: 10,
  idleTimeoutMillis: 45000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (error) => {
  logger.error({ error }, 'PostgreSQL pool error');
});

export const db = drizzle(pool, { schema });

export const connectDB = async (): Promise<void> => {
  const startTime = Date.now();

  try {
    const client = await pool.connect();
    client.release();

    const connectionTime = Date.now() - startTime;
    logger.info(`PostgreSQL connected successfully in ${connectionTime}ms`);
  } catch (error) {
    logger.error({ error }, 'PostgreSQL initial connection error');
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await pool.end();
    logger.info('PostgreSQL disconnected gracefully');
  } catch (error) {
    logger.error({ error }, 'Error disconnecting from PostgreSQL');
    throw error;
  }
};

export { pool };
