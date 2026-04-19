import request from 'supertest';

import app from '@/app';
import { container, TOKENS } from '@/di';
import RedisService from '@/services/redis.service';

import {
  clearDatabase,
  connectTestDB,
  disconnectTestDB,
  getCsrfSession,
  loginAsAdmin,
  seedAdmin,
  TEST_ADMIN,
} from '../../helpers';

const redisService = container.get<RedisService>(TOKENS.RedisService);

describe('Auth API (E2E)', () => {
  let csrf: { csrfToken: string; cookieHeader: string };

  beforeAll(async () => {
    await connectTestDB();
    await redisService.connect();
  });

  afterAll(async () => {
    await redisService.disconnect();
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    await seedAdmin();
    csrf = await getCsrfSession();
  });

  // ──────────────── LOGIN ────────────────

  describe('POST /api/v1/auth/login', () => {
    it('should reject login without CSRF token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

      expect(res.status).toBe(403);
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('x-csrf-token', csrf.csrfToken)
        .set('Cookie', csrf.cookieHeader)
        .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(TEST_ADMIN.email);
      expect(res.body.data.token).toBeDefined();

      // Should set refreshToken cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
    });

    it('should return 401 with wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('x-csrf-token', csrf.csrfToken)
        .set('Cookie', csrf.cookieHeader)
        .send({ email: TEST_ADMIN.email, password: 'wrong-password' });

      expect(res.status).toBe(401);
    });

    it('should return 401 with non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('x-csrf-token', csrf.csrfToken)
        .set('Cookie', csrf.cookieHeader)
        .send({ email: 'nobody@test.com', password: 'password123' });

      expect(res.status).toBe(401);
    });

    it('should return 400 with missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('x-csrf-token', csrf.csrfToken)
        .set('Cookie', csrf.cookieHeader)
        .send({ email: TEST_ADMIN.email });

      expect(res.status).toBe(400);
    });
  });

  // ──────────────── LOGOUT ────────────────

  describe('POST /api/v1/auth/logout', () => {
    it('should logout and clear cookies', async () => {
      const { token } = await loginAsAdmin();

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Logout');
    });

    it('should succeed even without auth header', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('x-csrf-token', csrf.csrfToken)
        .set('Cookie', csrf.cookieHeader);

      expect(res.status).toBe(200);
    });
  });

  // ──────────────── REFRESH TOKEN ────────────────

  describe('POST /api/v1/auth/refresh-token', () => {
    it('should return a new access token given a valid refresh cookie', async () => {
      // Login first to obtain encrypted refreshToken cookie
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .set('x-csrf-token', csrf.csrfToken)
        .set('Cookie', csrf.cookieHeader)
        .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

      expect(loginRes.status).toBe(200);

      const setCookieHeader = loginRes.headers['set-cookie'] as
        | string[]
        | string
        | undefined;
      expect(setCookieHeader).toBeDefined();

      // Forward refresh + csrf cookies to the refresh endpoint
      const refreshCookies = Array.isArray(setCookieHeader)
        ? setCookieHeader.join('; ')
        : String(setCookieHeader);
      const cookies = `${csrf.cookieHeader}; ${refreshCookies}`;

      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('x-csrf-token', csrf.csrfToken)
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();

      // Should issue a new refreshToken cookie
      const newCookies = res.headers['set-cookie'];
      expect(newCookies).toBeDefined();
    });

    it('should return 401 when no refresh cookie is provided', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('x-csrf-token', csrf.csrfToken)
        .set('Cookie', csrf.cookieHeader);

      expect(res.status).toBe(401);
    });

    it('should return 401 when refresh cookie contains an invalid token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('x-csrf-token', csrf.csrfToken)
        .set(
          'Cookie',
          `${csrf.cookieHeader}; refreshToken=invalid-garbage-token`
        );

      expect(res.status).toBe(401);
    });

    it('should reject reuse of the same refresh token cookie', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .set('x-csrf-token', csrf.csrfToken)
        .set('Cookie', csrf.cookieHeader)
        .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

      const originalCookie = loginRes.headers['set-cookie'];
      expect(originalCookie).toBeDefined();

      const cookieHeader = Array.isArray(originalCookie)
        ? originalCookie.join('; ')
        : String(originalCookie);
      const refreshWithCsrfCookie = `${csrf.cookieHeader}; ${cookieHeader}`;

      const firstRefresh = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('x-csrf-token', csrf.csrfToken)
        .set('Cookie', refreshWithCsrfCookie);

      expect(firstRefresh.status).toBe(200);

      const replayRefresh = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('x-csrf-token', csrf.csrfToken)
        .set('Cookie', refreshWithCsrfCookie);

      expect(replayRefresh.status).toBe(401);
    });

    it('should revoke the refresh token on logout', async () => {
      const agent = request.agent(app);
      const csrfRes = await agent.get('/api/v1/csrf-token');
      const csrfToken = csrfRes.body.csrfToken as string;

      const loginRes = await agent
        .post('/api/v1/auth/login')
        .set('x-csrf-token', csrfToken)
        .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

      const accessToken = loginRes.body.data.token as string;

      const logoutRes = await agent
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-csrf-token', csrfToken);

      expect(logoutRes.status).toBe(200);

      const refreshAfterLogout = await agent
        .post('/api/v1/auth/refresh-token')
        .set('x-csrf-token', csrfToken);

      expect(refreshAfterLogout.status).toBe(401);
    });
  });

  // ──────────────── FORGOT PASSWORD ────────────────

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should return 200 with a success message for a valid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .set('x-csrf-token', csrf.csrfToken)
        .set('Cookie', csrf.cookieHeader)
        .send({ email: TEST_ADMIN.email });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('If that email is registered');
    });

    it('should return 400 for an invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .set('x-csrf-token', csrf.csrfToken)
        .set('Cookie', csrf.cookieHeader)
        .send({ email: 'invalid-email' });

      expect(res.status).toBe(400);
    });

    it('should return 200 even for an unregistered email to prevent email enumeration', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .set('x-csrf-token', csrf.csrfToken)
        .set('Cookie', csrf.cookieHeader)
        .send({ email: 'nonexistent@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('If that email is registered');
    });
  });

  // ──────────────── RESET PASSWORD ────────────────

  describe('POST /api/v1/auth/reset-password', () => {
    it('should return 400 if token or password is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .set('x-csrf-token', csrf.csrfToken)
        .set('Cookie', csrf.cookieHeader)
        .send({ token: 'something' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for an invalid or expired token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .set('x-csrf-token', csrf.csrfToken)
        .set('Cookie', csrf.cookieHeader)
        .send({ token: 'invalid-token', password: 'newPassword123' });

      expect(res.status).toBe(400);
    });

    it('should successfully reset the password with a valid token', async () => {
      const passwordResetTokenService =
        container.get<PasswordResetTokenService>(
          TOKENS.PasswordResetTokenService
        );
      const userRes = await request(app)
        .post('/api/v1/auth/login')
        .set('x-csrf-token', csrf.csrfToken)
        .set('Cookie', csrf.cookieHeader)
        .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

      const userId = userRes.body.data.user.id;
      const token = await passwordResetTokenService.generateToken(userId);

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .set('x-csrf-token', csrf.csrfToken)
        .set('Cookie', csrf.cookieHeader)
        .send({ token, password: 'newPassword123' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Password reset successfully');

      // Verify login with new password works
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .set('x-csrf-token', csrf.csrfToken)
        .set('Cookie', csrf.cookieHeader)
        .send({ email: TEST_ADMIN.email, password: 'newPassword123' });

      expect(loginRes.status).toBe(200);
    });
  });
});
