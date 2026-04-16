import { Request } from 'express';
import rateLimit, { Options } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';

import { container, TOKENS } from '@/di';
import RedisService from '@/services/redis.service';

const redisService = container.get<RedisService>(TOKENS.RedisService);

let redisStore: RedisStore | undefined;

const getStore = (): RedisStore | undefined => {
  if (redisStore) return redisStore;

  try {
    const client = redisService.instance;
    if (!client) return undefined;

    redisStore = new RedisStore({
      // @ts-expect-error - Known issue: ioredis vs rate-limit-redis types
      sendCommand: (...args: string[]) => client.call(...args),
      prefix: 'rl:',
    });

    return redisStore;
  } catch {
    return undefined;
  }
};

const keyGenerator = (req: Request): string => {
  return req.user?.sub ?? req.ip ?? 'unknown';
};

const isTestEnv = process.env.NODE_ENV === 'test';

const noopMiddleware = (_req: Request, _res: unknown, next: () => void) =>
  next();

const createLimiter = (options: Partial<Options>) => {
  // Skip rate limiting in test environment
  if (isTestEnv) return noopMiddleware;

  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    keyGenerator,
    ...options,
    store: getStore(),
  });
};

export const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests', code: 'TOO_MANY_REQUESTS' },
});

export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many login attempts', code: 'TOO_MANY_REQUESTS' },
});
