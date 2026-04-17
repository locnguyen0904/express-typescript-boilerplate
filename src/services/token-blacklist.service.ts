import { inject, injectable } from 'inversify';

import { TOKENS } from '@/di/tokens';

import RedisService from './redis.service';

const PREFIX = 'token:blacklist:';

@injectable()
export default class TokenBlacklistService {
  constructor(
    @inject(TOKENS.RedisService) private readonly redis: RedisService
  ) {}

  async revoke(jti: string, ttlSeconds: number): Promise<void> {
    if (!this.redis.isConnected || ttlSeconds <= 0) return;
    await this.redis.set(`${PREFIX}${jti}`, 1, ttlSeconds);
  }

  async revokeIfFirstUse(jti: string, ttlSeconds: number): Promise<boolean> {
    if (!this.redis.isConnected || ttlSeconds <= 0) return false;
    return this.redis.setIfAbsent(`${PREFIX}${jti}`, 1, ttlSeconds);
  }

  async isRevoked(jti: string): Promise<boolean> {
    if (!this.redis.isConnected) return false;
    const result = await this.redis.get<number>(`${PREFIX}${jti}`);
    return result !== null;
  }
}
