import request from 'supertest';

import app from '@/app';

import {
  clearDatabase,
  connectTestDB,
  disconnectTestDB,
  getCsrfSession,
  loginAsAdmin,
  seedAdmin,
  TEST_ADMIN,
} from '../../helpers';

describe('Auth API (E2E)', () => {
  let csrf: { csrfToken: string; cookieHeader: string };

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    await seedAdmin();
    csrf = await getCsrfSession();
  });

  // ──────────────── LOGIN ────────────────

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
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
        .send({ email: TEST_ADMIN.email, password: 'wrong-password' });

      expect(res.status).toBe(401);
    });

    it('should return 401 with non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@test.com', password: 'password123' });

      expect(res.status).toBe(401);
    });

    it('should return 400 with missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
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
      const res = await request(app).post('/api/v1/auth/logout');

      expect(res.status).toBe(200);
    });
  });

  // ──────────────── REFRESH TOKEN ────────────────

  describe('POST /api/v1/auth/refresh-token', () => {
    it('should return a new access token given a valid refresh cookie', async () => {
      // Login first to obtain encrypted refreshToken cookie
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

      expect(loginRes.status).toBe(200);

      const setCookieHeader = loginRes.headers['set-cookie'] as
        | string[]
        | string
        | undefined;
      expect(setCookieHeader).toBeDefined();

      // Forward the cookies from login to the refresh endpoint
      const cookies = Array.isArray(setCookieHeader)
        ? setCookieHeader.join('; ')
        : String(setCookieHeader);

      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();

      // Should issue a new refreshToken cookie
      const newCookies = res.headers['set-cookie'];
      expect(newCookies).toBeDefined();
    });

    it('should return 401 when no refresh cookie is provided', async () => {
      const res = await request(app).post('/api/v1/auth/refresh-token');

      expect(res.status).toBe(401);
    });

    it('should return 401 when refresh cookie contains an invalid token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', 'refreshToken=invalid-garbage-token');

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
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .set('x-csrf-token', csrf.csrfToken)
        .set('Cookie', csrf.cookieHeader)
        .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

      const accessToken = loginRes.body.data.token as string;
      const refreshCookie = loginRes.headers['set-cookie'];
      expect(refreshCookie).toBeDefined();

      const cookieHeader = Array.isArray(refreshCookie)
        ? refreshCookie.join('; ')
        : String(refreshCookie);
      const refreshWithCsrfCookie = `${csrf.cookieHeader}; ${cookieHeader}`;

      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-csrf-token', csrf.csrfToken)
        .set('Cookie', cookieHeader);

      expect(logoutRes.status).toBe(200);

      const refreshAfterLogout = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('x-csrf-token', csrf.csrfToken)
        .set('Cookie', refreshWithCsrfCookie);

      expect(refreshAfterLogout.status).toBe(401);
    });
  });
});
