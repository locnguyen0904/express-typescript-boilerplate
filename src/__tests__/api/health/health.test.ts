const mockConfig = {
  redis: {
    enabled: true,
  },
};

const mockRedisService = {
  isConnected: false,
};

const mockPool = {
  connect: jest.fn().mockResolvedValue({
    release: jest.fn(),
  }),
};

jest.mock('@/config', () => ({
  config: mockConfig,
}));

jest.mock('@/container', () => ({
  redisService: mockRedisService,
}));

jest.mock('@/services/database.service', () => ({
  db: {},
  pool: mockPool,
  connectDB: jest.fn(),
  disconnectDB: jest.fn(),
}));

import { healthHandler } from '@/api/health';

describe('healthHandler', () => {
  const createResponse = () => {
    let statusCode = 200;
    let body: unknown;

    const response = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(payload: unknown) {
        body = payload;
        return this;
      },
    };

    return {
      response,
      getStatusCode: () => statusCode,
      getBody: () =>
        body as {
          status: string;
          checks: { database: string; redis: string };
        },
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig.redis.enabled = true;
    mockRedisService.isConnected = false;
    mockPool.connect.mockResolvedValue({ release: jest.fn() });
  });

  it('returns 503 when Redis is required but unavailable', async () => {
    const { response, getStatusCode, getBody } = createResponse();

    await healthHandler({} as never, response as never);

    expect(getStatusCode()).toBe(503);
    expect(getBody()).toMatchObject({
      status: 'error',
      checks: {
        database: 'up',
        redis: 'down',
      },
    });
  });

  it('returns 200 and marks Redis disabled when cache is optional', async () => {
    mockConfig.redis.enabled = false;

    const { response, getStatusCode, getBody } = createResponse();

    await healthHandler({} as never, response as never);

    expect(getStatusCode()).toBe(200);
    expect(getBody()).toMatchObject({
      status: 'ok',
      checks: {
        database: 'up',
        redis: 'disabled',
      },
    });
  });
});
