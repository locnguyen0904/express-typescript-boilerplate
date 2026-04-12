import './health.doc';

import { Request, Response, Router } from 'express';
import mongoose from 'mongoose';

import { config } from '@/config';
import { redisService } from '@/container';

export const healthHandler = async (_req: Request, res: Response) => {
  const dbReady = mongoose.connection.readyState === 1;
  const redisRequired = config.redis.enabled;
  const redisReady = redisRequired ? redisService.isConnected : true;
  const allHealthy = dbReady && redisReady;

  const payload = {
    status: allHealthy ? 'ok' : 'error',
    uptime: process.uptime(),
    timestamp: Date.now(),
    checks: {
      database: dbReady ? 'up' : 'down',
      redis: redisRequired ? (redisReady ? 'up' : 'down') : 'disabled',
    },
  };

  return res.status(allHealthy ? 200 : 503).json(payload);
};

const router = Router();

router.get('/', healthHandler);

export default router;
