import request from 'supertest';

import User from '@/api/users/user.model';
import app from '@/app';

import {
  authRequest,
  clearDatabase,
  connectTestDB,
  disconnectTestDB,
  loginAsAdmin,
  loginAsUser,
  seedAdmin,
  seedUser,
  TEST_USER,
} from '../../helpers';

describe('Users API (E2E)', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    await seedAdmin();
    await seedUser();
  });

  // ──────────────── CREATE ────────────────

  describe('POST /api/v1/users', () => {
    it('should create a new user when admin', async () => {
      const { token } = await loginAsAdmin();
      const newUser = {
        fullName: 'New Person',
        email: 'new@test.com',
        password: 'Secure@123',
      };

      const res = await authRequest(token).post('/api/v1/users').send(newUser);

      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe(newUser.email);
      expect(res.body.data.fullName).toBe(newUser.fullName);
      expect(res.body.data.role).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      const { token } = await loginAsAdmin();
      const duplicate = {
        fullName: 'Duplicate',
        email: TEST_USER.email,
        password: 'Secure@123',
      };

      const res = await authRequest(token)
        .post('/api/v1/users')
        .send(duplicate);

      expect(res.status).toBe(400);
    });

    it('should deny access for regular user', async () => {
      const { token } = await loginAsUser();
      const newUser = {
        fullName: 'Hacker',
        email: 'hack@test.com',
        password: 'Secure@123',
      };

      const res = await authRequest(token).post('/api/v1/users').send(newUser);

      expect(res.status).toBe(403);
    });

    it('should deny access without authentication', async () => {
      const res = await request(app).post('/api/v1/users').send({
        fullName: 'Anonymous',
        email: 'anon@test.com',
        password: 'Secure@123',
      });

      expect(res.status).toBe(401);
    });

    it('should return 400 with invalid body', async () => {
      const { token } = await loginAsAdmin();

      const res = await authRequest(token)
        .post('/api/v1/users')
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
    });
  });

  // ──────────────── FIND ALL ────────────────

  describe('GET /api/v1/users', () => {
    it('should return paginated list for admin', async () => {
      const { token } = await loginAsAdmin();

      const res = await authRequest(token).get('/api/v1/users');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(2);
      expect(res.body.page).toBeDefined();
    });

    it('should deny access for regular user', async () => {
      const { token } = await loginAsUser();

      const res = await authRequest(token).get('/api/v1/users');

      expect(res.status).toBe(403);
    });
  });

  // ──────────────── FIND ONE ────────────────

  describe('GET /api/v1/users/:id', () => {
    it('should return user by id for admin', async () => {
      const { token } = await loginAsAdmin();
      const user = await User.findOne({ email: TEST_USER.email }).lean();

      const res = await authRequest(token).get(
        `/api/v1/users/${user!._id.toString()}`
      );

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(TEST_USER.email);
    });

    it('should return 404 for non-existent id', async () => {
      const { token } = await loginAsAdmin();
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await authRequest(token).get(`/api/v1/users/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  // ──────────────── UPDATE ────────────────

  describe('PUT /api/v1/users/:id', () => {
    it('should update user for admin', async () => {
      const { token } = await loginAsAdmin();
      const user = await User.findOne({ email: TEST_USER.email }).lean();

      const res = await authRequest(token)
        .put(`/api/v1/users/${user!._id.toString()}`)
        .send({ fullName: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.fullName).toBe('Updated Name');
    });

    it('should reject duplicate email on update', async () => {
      const { token } = await loginAsAdmin();
      const user = await User.findOne({ email: TEST_USER.email }).lean();

      const res = await authRequest(token)
        .put(`/api/v1/users/${user!._id.toString()}`)
        .send({ email: 'admin@test.com' });

      expect(res.status).toBe(400);
    });
  });

  // ──────────────── DELETE ────────────────

  describe('DELETE /api/v1/users/:id', () => {
    it('should soft delete user for admin', async () => {
      const { token } = await loginAsAdmin();
      const user = await User.findOne({ email: TEST_USER.email }).lean();

      const res = await authRequest(token).delete(
        `/api/v1/users/${user!._id.toString()}`
      );

      expect(res.status).toBe(200);

      // Should be soft deleted (not in normal query)
      const deleted = await User.findOne({ email: TEST_USER.email }).lean();
      expect(deleted).toBeNull();
    });
  });
});
