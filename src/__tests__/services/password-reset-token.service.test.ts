import PasswordResetTokenService from '@/services/password-reset-token.service';
import RedisService from '@/services/redis.service';

describe('PasswordResetTokenService', () => {
  let service: PasswordResetTokenService;
  let mockRedis: jest.Mocked<RedisService>;

  beforeEach(() => {
    mockRedis = {
      get isConnected() {
        return true;
      },
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    service = new PasswordResetTokenService(mockRedis);
  });

  describe('generateToken', () => {
    it('should generate a token, store its hashed value in Redis, and return the raw token', async () => {
      mockRedis.set.mockResolvedValue(true);

      const token = await service.generateToken('123-abc', 900); // 15 mins

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(16);

      expect(mockRedis.set).toHaveBeenCalledTimes(1);
      const setCall = mockRedis.set.mock.calls[0];
      const key = setCall[0];
      expect(key.startsWith('token:reset:')).toBe(true);
      expect(setCall[1]).toBe('123-abc'); // Value is the user ID
      expect(setCall[2]).toBe(900); // TTL in seconds
    });

    it('should throw an error if Redis is not connected', async () => {
      jest.spyOn(mockRedis, 'isConnected', 'get').mockReturnValue(false);
      await expect(service.generateToken('123-abc', 900)).rejects.toThrow(
        'Redis is not connected'
      );
    });
  });

  describe('validateToken', () => {
    it('should return userId and delete token if valid', async () => {
      const rawToken = 'test-token';
      mockRedis.get.mockResolvedValue('123-abc');
      mockRedis.del.mockResolvedValue(true);

      const userId = await service.validateToken(rawToken);

      expect(userId).toBe('123-abc');
      expect(mockRedis.get).toHaveBeenCalledTimes(1);
      expect(mockRedis.del).toHaveBeenCalledTimes(1);

      const getCall = mockRedis.get.mock.calls[0];
      expect(getCall[0].startsWith('token:reset:')).toBe(true);
    });

    it('should return null if token is invalid or expired', async () => {
      mockRedis.get.mockResolvedValue(null);

      const userId = await service.validateToken('invalid-token');

      expect(userId).toBeNull();
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should return null if Redis is not connected', async () => {
      jest.spyOn(mockRedis, 'isConnected', 'get').mockReturnValue(false);
      const userId = await service.validateToken('test-token');
      expect(userId).toBeNull();
    });
  });
});
