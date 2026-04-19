import crypto from 'crypto';

import { inject, injectable } from 'inversify';

import { TOKENS } from '@/di/tokens';

import RedisService from './redis.service';

const PREFIX = 'token:reset:';

@injectable()
export default class PasswordResetTokenService {
  constructor(
    @inject(TOKENS.RedisService) private readonly redis: RedisService
  ) {}

  async generateToken(
    userId: number,
    ttlSeconds: number = 900
  ): Promise<string> {
    if (!this.redis.isConnected) {
      throw new Error('Redis is not connected');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    await this.redis.set(`${PREFIX}${hashedToken}`, userId, ttlSeconds);

    return rawToken;
  }

  async validateToken(rawToken: string): Promise<number | null> {
    if (!this.redis.isConnected) {
      return null;
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const key = `${PREFIX}${hashedToken}`;

    const userId = await this.redis.get<number>(key);

    if (userId !== null) {
      await this.redis.del(key);
      return userId;
    }

    return null;
  }
}
