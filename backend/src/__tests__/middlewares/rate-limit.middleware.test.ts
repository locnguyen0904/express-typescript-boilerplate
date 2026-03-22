import { apiLimiter, authLimiter } from '@/middlewares/rate-limit.middleware';

describe('Rate Limit Middleware', () => {
  it('should export apiLimiter and authLimiter as functions', () => {
    expect(typeof apiLimiter).toBe('function');
    expect(typeof authLimiter).toBe('function');
  });

  it('should bypass rate limiting in test environment', () => {
    const mockNext = jest.fn();
    (apiLimiter as (req: unknown, res: unknown, next: jest.Mock) => void)(
      {},
      {},
      mockNext
    );

    // In test env, rate limiter is a noop — next() called immediately
    expect(mockNext).toHaveBeenCalled();
  });
});
