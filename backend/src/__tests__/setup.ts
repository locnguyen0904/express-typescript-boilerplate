// ──────────────────────────────────────────────
// ENV: Direct assignment for CI without .env
// Must match src/config/env.schema.ts
// ──────────────────────────────────────────────
process.env.DATABASE_URL =
  process.env.MONGO_MEMORY_URI || 'mongodb://localhost:27017/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-key-32-characters-long-minimum-integrity';
process.env.JWT_ACCESS_EXPIRATION_MINUTES = '30';
process.env.JWT_REFRESH_EXPIRATION_DAYS = '30';
process.env.ADMIN_NAME = 'Test Admin';
process.env.ADMIN_EMAIL = 'admin@test.local';
process.env.ADMIN_PASSWORD = 'password123';
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.ENCRYPTION_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4'; // 32 hex chars for AES-256

// ──────────────────────────────────────────────
// GLOBAL MOCKS: Only infrastructure that is
// always needed and never the SUT
// ──────────────────────────────────────────────

// Silence pino-http: must return a real middleware that calls next()
jest.mock('pino-http', () =>
  jest.fn(() => (_req: unknown, _res: unknown, next: () => void) => next())
);

// Silence pino logger
jest.mock('@/services/logger.service', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  },
}));
