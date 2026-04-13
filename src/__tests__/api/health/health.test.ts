import mongoose from 'mongoose';

const mockConfig = {
  redis: {
    enabled: true,
  },
};

const mockRedisService = {
  isConnected: false,
};

jest.mock('@/config', () => ({
  config: mockConfig,
}));

jest.mock('@/container', () => ({
  redisService: mockRedisService,
}));

import { healthHandler } from '@/api/health';

describe('healthHandler', () => {
  const originalReadyState = mongoose.connection.readyState;

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
    mockConfig.redis.enabled = true;
    mockRedisService.isConnected = false;
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 1,
      configurable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: originalReadyState,
      configurable: true,
    });
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
