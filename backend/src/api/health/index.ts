import './health.doc';

import { Request, Response, Router } from 'express';
import mongoose from 'mongoose';

import { redisService } from '@/container';

export const healthHandler = async (_req: Request, res: Response) => {
  const dbReady = mongoose.connection.readyState === 1;
  const redisReady = redisService.isConnected;
  const allHealthy = dbReady && redisReady;

  const payload = {
    status: allHealthy ? 'ok' : 'error',
    uptime: process.uptime(),
    timestamp: Date.now(),
    checks: {
      database: dbReady ? 'up' : 'down',
      redis: redisReady ? 'up' : 'down',
    },
  };

  return res.status(allHealthy ? 200 : 503).json(payload);
};

const router = Router();

router.get('/', healthHandler);

export default router;
