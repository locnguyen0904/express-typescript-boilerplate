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
    return req.headers.authorization?.startsWith('Bearer ') ?? false;
  },
});

export { doubleCsrfProtection, generateCsrfToken };
