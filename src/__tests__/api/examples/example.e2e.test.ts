import request from 'supertest';

import Example from '@/api/examples/example.model';
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
} from '../../helpers';

// ──────────────────────────────────────────────
// Seed Helper
// ──────────────────────────────────────────────
async function seedExamples(count = 3) {
  const docs = Array.from({ length: count }, (_, i) => ({
    title: `Example ${i + 1}`,
    content: `Content for example ${i + 1}`,
  }));
  return Example.insertMany(docs);
}

describe('Examples API (E2E)', () => {
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

  describe('POST /api/v1/examples', () => {
    it('should create an example when admin', async () => {
      const { token } = await loginAsAdmin();
      const payload = { title: 'New Example', content: 'Some content' };

      const res = await authRequest(token)
        .post('/api/v1/examples')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe(payload.title);
      expect(res.body.data.content).toBe(payload.content);
    });

    it('should deny access for regular user', async () => {
      const { token } = await loginAsUser();

      const res = await authRequest(token)
        .post('/api/v1/examples')
        .send({ title: 'Hacked', content: 'Nope' });

      expect(res.status).toBe(403);
    });

    it('should deny access without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/examples')
        .send({ title: 'Anon', content: 'No auth' });

      expect(res.status).toBe(401);
    });

    it('should return 400 with missing fields', async () => {
      const { token } = await loginAsAdmin();

      const res = await authRequest(token)
        .post('/api/v1/examples')
        .send({ title: 'No content' });

      expect(res.status).toBe(400);
    });
  });

  // ──────────────── FIND ALL (Public) ────────────────

  describe('GET /api/v1/examples', () => {
    it('should return paginated list (no auth needed)', async () => {
      await seedExamples(5);

      const res = await request(app).get('/api/v1/examples');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.total).toBe(5);
      expect(res.body.page).toBeDefined();
    });

    it('should return empty list when no examples', async () => {
      const res = await request(app).get('/api/v1/examples');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });

    it('should return paginated response structure', async () => {
      await seedExamples(10);

      const res = await request(app).get('/api/v1/examples');

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(10);
      expect(res.body.page).toBeGreaterThanOrEqual(1);
      expect(res.body.pages).toBeDefined();
      expect(res.body.limit).toBeDefined();
    });
  });

  // ──────────────── FIND ONE (Public) ────────────────

  describe('GET /api/v1/examples/:id', () => {
    it('should return example by id (no auth needed)', async () => {
      const [example] = await seedExamples(1);

      const res = await request(app).get(
        `/api/v1/examples/${example._id.toString()}`
      );

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Example 1');
    });

    it('should return 404 for non-existent id', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await request(app).get(`/api/v1/examples/${fakeId}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid id format', async () => {
      const res = await request(app).get('/api/v1/examples/not-an-id');

      expect(res.status).toBe(400);
    });
  });

  // ──────────────── UPDATE ────────────────

  describe('PUT /api/v1/examples/:id', () => {
    it('should update example when admin', async () => {
      const { token } = await loginAsAdmin();
      const [example] = await seedExamples(1);

      const res = await authRequest(token)
        .put(`/api/v1/examples/${example._id.toString()}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.content).toBe('Content for example 1');
    });

    it('should return 404 for non-existent id', async () => {
      const { token } = await loginAsAdmin();
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await authRequest(token)
        .put(`/api/v1/examples/${fakeId}`)
        .send({ title: 'Ghost' });

      expect(res.status).toBe(404);
    });

    it('should deny access for regular user', async () => {
      const { token } = await loginAsUser();
      const [example] = await seedExamples(1);

      const res = await authRequest(token)
        .put(`/api/v1/examples/${example._id.toString()}`)
        .send({ title: 'Nope' });

      expect(res.status).toBe(403);
    });
  });

  // ──────────────── DELETE ────────────────

  describe('DELETE /api/v1/examples/:id', () => {
    it('should soft delete example when admin', async () => {
      const { token } = await loginAsAdmin();
      const [example] = await seedExamples(1);

      const res = await authRequest(token).delete(
        `/api/v1/examples/${example._id.toString()}`
      );

      expect(res.status).toBe(200);

      // Should not appear in normal queries
      const found = await Example.findById(example._id);
      expect(found).toBeNull();
    });

    it('should return 404 for non-existent id', async () => {
      const { token } = await loginAsAdmin();
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await authRequest(token).delete(`/api/v1/examples/${fakeId}`);

      expect(res.status).toBe(404);
    });

    it('should deny access without authentication', async () => {
      const [example] = await seedExamples(1);

      const res = await request(app).delete(
        `/api/v1/examples/${example._id.toString()}`
      );

      expect(res.status).toBe(401);
    });
  });
});
