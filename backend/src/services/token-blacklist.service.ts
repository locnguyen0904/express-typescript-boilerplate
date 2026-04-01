import RedisService from './redis.service';

const PREFIX = 'token:blacklist:';

export default class TokenBlacklistService {
  constructor(private readonly redis: RedisService) {}

  async revoke(jti: string, ttlSeconds: number): Promise<void> {
    if (!this.redis.isConnected || ttlSeconds <= 0) return;
    await this.redis.set(`${PREFIX}${jti}`, 1, ttlSeconds);
  }

  async isRevoked(jti: string): Promise<boolean> {
    if (!this.redis.isConnected) return false;
    const result = await this.redis.get<number>(`${PREFIX}${jti}`);
    return result !== null;
  }
}
