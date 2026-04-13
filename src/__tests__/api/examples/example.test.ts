import request from 'supertest';

import app from '@/app';

import { connectTestDB, disconnectTestDB } from '../../helpers';

describe('Root & Health API (E2E)', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe('GET /', () => {
    it('should return welcome message', async () => {
      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Welcome');
    });
  });

  describe('GET /api/v1/health', () => {
    it('should return health status with DB up', async () => {
      const res = await request(app).get('/api/v1/health');

      // DB is connected via memory server, Redis is not
      expect(res.body.status).toBeDefined();
      expect(res.body.checks.database).toBe('up');
      expect(res.body.checks.redis).toBe('down'); // No real Redis in test
    });
  });
});
