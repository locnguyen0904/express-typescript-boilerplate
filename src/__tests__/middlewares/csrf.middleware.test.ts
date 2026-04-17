import { doubleCsrf } from 'csrf-csrf';

import {
  doubleCsrfProtection,
  generateCsrfToken,
} from '@/middlewares/csrf.middleware';

// Mock doubleCsrf before importing the middleware
jest.mock('csrf-csrf', () => ({
  doubleCsrf: jest.fn().mockReturnValue({
    doubleCsrfProtection: jest.fn(),
    generateCsrfToken: jest.fn(),
  }),
}));

interface MinimalRequest {
  headers: Record<string, string | undefined>;
}

describe('CSRF Middleware', () => {
  let doubleCsrfMock: jest.Mock;
  let skipCsrfProtection: (req: MinimalRequest) => boolean;

  beforeAll(() => {
    doubleCsrfMock = doubleCsrf as jest.Mock;

    const config = doubleCsrfMock.mock.calls[0][0] as {
      skipCsrfProtection: (req: MinimalRequest) => boolean;
    };

    skipCsrfProtection = config.skipCsrfProtection;
  });

  it('should export doubleCsrfProtection and generateCsrfToken', () => {
    expect(doubleCsrfProtection).toBeDefined();
    expect(generateCsrfToken).toBeDefined();
  });

  describe('skipCsrfProtection logic', () => {
    it('should skip CSRF for Bearer token authorization', () => {
      const mockReq: MinimalRequest = {
        headers: { authorization: 'Bearer some-token' },
      };
      expect(skipCsrfProtection(mockReq)).toBe(true);
    });

    it('should NOT skip CSRF when no CSRF token header is present', () => {
      const mockReq: MinimalRequest = {
        headers: {},
      };
      expect(skipCsrfProtection(mockReq)).toBe(false);
    });

    it('should NOT skip CSRF if CSRF token header is present and NOT a Bearer auth', () => {
      const mockReq: MinimalRequest = {
        headers: {
          'x-csrf-token': 'some-token',
        },
      };
      expect(skipCsrfProtection(mockReq)).toBe(false);

      const mockReqXsrf: MinimalRequest = {
        headers: {
          authorization: 'Basic user:pass',
          'x-xsrf-token': 'some-token',
        },
      };
      expect(skipCsrfProtection(mockReqXsrf)).toBe(false);
    });
  });
});
