import '@/middlewares/http-logger.middleware';

import { IncomingMessage } from 'http';

import pinoHttp from 'pino-http';

describe('HttpLogger Middleware', () => {
  let autoLoggingFn: (req: IncomingMessage) => boolean;

  beforeAll(() => {
    const calls = (pinoHttp as jest.Mock).mock.calls;
    const config = calls[0][0] as {
      autoLogging: { ignore: (req: IncomingMessage) => boolean };
    };
    autoLoggingFn = config.autoLogging.ignore;
  });

  it('should initialize pino-http with middleware', () => {
    expect(pinoHttp).toHaveBeenCalled();
  });

  describe('autoLogging filter', () => {
    it('should ignore health check endpoint', () => {
      const mockReq = { url: '/health' } as IncomingMessage;
      expect(autoLoggingFn(mockReq)).toBe(true);
    });

    it('should not ignore standard API endpoints', () => {
      const mockReq = { url: '/api/v1/users' } as IncomingMessage;
      expect(autoLoggingFn(mockReq)).toBe(false);
    });
  });
});
