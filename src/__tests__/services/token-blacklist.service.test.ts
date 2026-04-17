import RedisService from '@/services/redis.service';
import TokenBlacklistService from '@/services/token-blacklist.service';

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService;
  let mockRedis: jest.Mocked<RedisService>;

  beforeEach(() => {
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      setIfAbsent: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    // Define isConnected as a property we can change
    Object.defineProperty(mockRedis, 'isConnected', {
      get: jest.fn(() => true),
      configurable: true,
    });

    service = new TokenBlacklistService(mockRedis);
  });

  describe('revoke', () => {
    it('should set token in redis if connected', async () => {
      const jti = 'jti-123';
      const ttl = 3600;

      await service.revoke(jti, ttl);

      expect(mockRedis.set).toHaveBeenCalledWith(
        `token:blacklist:${jti}`,
        1,
        ttl
      );
    });

    it('should do nothing if redis is disconnected', async () => {
      jest.spyOn(mockRedis, 'isConnected', 'get').mockReturnValue(false);
      await service.revoke('jti', 300);
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('should do nothing if ttl is zero or negative', async () => {
      await service.revoke('jti', 0);
      await service.revoke('jti', -10);
      expect(mockRedis.set).not.toHaveBeenCalled();
    });
  });

  describe('isRevoked', () => {
    it('should return true if token exists in redis', async () => {
      const jti = 'jti-123';
      mockRedis.get.mockResolvedValue(1);

      const result = await service.isRevoked(jti);

      expect(mockRedis.get).toHaveBeenCalledWith(`token:blacklist:${jti}`);
      expect(result).toBe(true);
    });

    it('should return false if token does not exist in redis', async () => {
      mockRedis.get.mockResolvedValue(null);
      const result = await service.isRevoked('jti-456');
      expect(result).toBe(false);
    });

    it('should return false if redis is disconnected', async () => {
      jest.spyOn(mockRedis, 'isConnected', 'get').mockReturnValue(false);
      const result = await service.isRevoked('some-jti');
      expect(result).toBe(false);
      expect(mockRedis.get).not.toHaveBeenCalled();
    });
  });

  describe('revokeIfFirstUse', () => {
    it('should reserve token on first use', async () => {
      const jti = 'jti-first';
      const ttl = 3600;
      mockRedis.setIfAbsent.mockResolvedValue(true);

      const result = await service.revokeIfFirstUse(jti, ttl);

      expect(mockRedis.setIfAbsent).toHaveBeenCalledWith(
        `token:blacklist:${jti}`,
        1,
        ttl
      );
      expect(result).toBe(true);
    });

    it('should return false if token is already reserved', async () => {
      mockRedis.setIfAbsent.mockResolvedValue(false);

      const result = await service.revokeIfFirstUse('jti-existing', 3600);

      expect(result).toBe(false);
    });
  });
});
