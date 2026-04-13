import { doubleCsrf } from 'csrf-csrf';

import { config } from '@/config';

const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => config.jwt.secret,
  getSessionIdentifier: (req) => req.ip || 'anonymous',
  cookieName: '__Host-csrf',
  cookieOptions: {
    sameSite: 'strict',
    path: '/',
    secure: config.env === 'production',
    httpOnly: true,
  },
  getCsrfTokenFromRequest: (req) =>
    (req.headers['x-csrf-token'] as string) ||
    (req.headers['x-xsrf-token'] as string),
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  skipCsrfProtection: (req) => {
    // Skip CSRF for Bearer token auth (API clients)
    if (req.headers.authorization?.startsWith('Bearer ')) {
      return true;
    }
    // Skip CSRF if client doesn't send csrf token header (non-admin clients)
    const hasCsrfToken =
      req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
    if (!hasCsrfToken) {
      return true;
    }
    return false;
  },
});

export { doubleCsrfProtection, generateCsrfToken };
