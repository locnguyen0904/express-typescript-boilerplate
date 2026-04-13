import Redis from 'ioredis';

import RedisService from '@/services/redis.service';

// Local ioredis mock — self-contained
jest.mock('ioredis', () => {
  const mockInstance = {
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    scan: jest.fn().mockResolvedValue(['0', []]),
    incr: jest.fn(),
    expire: jest.fn(),
    status: 'ready',
    call: jest.fn(),
    options: { host: 'localhost', port: 6379 },
  };
  const MockRedis = jest.fn(() => mockInstance);
  return MockRedis;
});

describe('RedisService', () => {
  let service: RedisService;
  let mockRedis: jest.Mocked<Record<string, jest.Mock>>;

  beforeEach(async () => {
    jest.clearAllMocks();
    service = new RedisService();
    await service.connect();

    // Get the mock instance created by the constructor
    const RedisConstructor = Redis as unknown as jest.Mock;
    mockRedis = RedisConstructor.mock.results[0].value;
  });

  describe('Operations', () => {
    it('get: should return parsed JSON value', async () => {
      const data = { foo: 'bar' };
      mockRedis.get.mockResolvedValue(JSON.stringify(data));

      const result = await service.get('test-key');

      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(data);
    });

    it('set: should stringify value and set with TTL', async () => {
      const data = { baz: 123 };
      await service.set('test-key', data, 60);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(data),
        'EX',
        60
      );
    });

    it('delByPrefix: should scan and delete matching keys', async () => {
      mockRedis.scan
        .mockResolvedValueOnce(['10', ['prefix:1', 'prefix:2']])
        .mockResolvedValueOnce(['0', ['prefix:3']]);

      await service.delByPrefix('prefix:');

      expect(mockRedis.scan).toHaveBeenCalledTimes(2);
      expect(mockRedis.del).toHaveBeenCalledWith('prefix:1', 'prefix:2');
      expect(mockRedis.del).toHaveBeenCalledWith('prefix:3');
    });
  });

  describe('Connection status', () => {
    it('isConnected should return true only when status is ready', () => {
      mockRedis.status = 'ready' as unknown as jest.Mock;
      expect(service.isConnected).toBe(true);

      mockRedis.status = 'connecting' as unknown as jest.Mock;
      expect(service.isConnected).toBe(false);
    });
  });
});
