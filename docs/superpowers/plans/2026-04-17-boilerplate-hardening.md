# Boilerplate Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Fix the security and onboarding gaps in this Express boilerplate so refresh-token auth, CSRF, Bull Board exposure, and local Docker setup are safe and predictable by default.

**Architecture:** Keep the fixes minimal and local to the existing auth, middleware, and config layers. Reuse the existing `TokenBlacklistService`, existing CSRF endpoint, and current Jest/Supertest setup instead of adding new infrastructure. Align the dev Docker story with the README by making `docker:up` start infrastructure only.

**Tech Stack:** Node.js 24, TypeScript, Express 5, Jest 30, Supertest, JWT, csrf-csrf, BullMQ, Docker Compose

---

## File Structure

**Modify**
- `src/api/auth/auth.service.ts`
  Purpose: enforce refresh-token single use and add a reusable token revocation helper.
- `src/api/auth/auth.controller.ts`
  Purpose: revoke refresh token on logout and keep refresh-cookie lifecycle correct.
- `src/__tests__/api/auth/auth.e2e.test.ts`
  Purpose: add regression tests for refresh replay and logout invalidation.
- `src/__tests__/helpers.ts`
  Purpose: add CSRF-aware login/test helpers so cookie-protected POST routes remain testable.
- `src/middlewares/csrf.middleware.ts`
  Purpose: remove the “missing CSRF header means skip protection” bypass.
- `src/__tests__/middlewares/csrf.middleware.test.ts`
  Purpose: lock in the stricter CSRF behavior.
- `src/config/env.schema.ts`
  Purpose: stop defaulting Bull Board credentials to insecure values.
- `src/config/env.config.ts`
  Purpose: expose Bull Board config explicitly instead of reading process env directly from app code.
- `src/app.ts`
  Purpose: mount Bull Board only when explicit credentials are configured.
- `.env.example`
  Purpose: document explicit Bull Board credentials and local dev flow.
- `docker-compose.yml`
  Purpose: make `docker:up` start PostgreSQL and Redis only.
- `README.md`
  Purpose: align Quick Start, Docker section, CSRF usage, and Bull Board setup with actual behavior.

**Test**
- `src/__tests__/api/auth/auth.e2e.test.ts`
- `src/__tests__/middlewares/csrf.middleware.test.ts`
- `src/__tests__/config/feature-flags.test.ts`

### Task 1: Harden Refresh Token Rotation And Logout Revocation

**Files:**
- Modify: `src/api/auth/auth.service.ts:45-117`
- Modify: `src/api/auth/auth.controller.ts:34-76`
- Modify: `src/__tests__/api/auth/auth.e2e.test.ts:72-138`
- Modify: `src/__tests__/helpers.ts:67-89`

- [x] **Step 1: Write the failing auth regression tests**

Add these tests to `src/__tests__/api/auth/auth.e2e.test.ts`:

```ts
it('should reject reuse of the same refresh token cookie', async () => {
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .set('x-csrf-token', csrf.csrfToken)
    .set('Cookie', csrf.cookieHeader)
    .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

  const originalCookie = loginRes.headers['set-cookie'];
  expect(originalCookie).toBeDefined();

  const firstRefresh = await request(app)
    .post('/api/v1/auth/refresh-token')
    .set('x-csrf-token', csrf.csrfToken)
    .set('Cookie', Array.isArray(originalCookie) ? originalCookie.join('; ') : String(originalCookie));

  expect(firstRefresh.status).toBe(200);

  const replayRefresh = await request(app)
    .post('/api/v1/auth/refresh-token')
    .set('x-csrf-token', csrf.csrfToken)
    .set('Cookie', Array.isArray(originalCookie) ? originalCookie.join('; ') : String(originalCookie));

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

  const logoutRes = await request(app)
    .post('/api/v1/auth/logout')
    .set('Authorization', `Bearer ${accessToken}`)
    .set('x-csrf-token', csrf.csrfToken)
    .set(
      'Cookie',
      Array.isArray(refreshCookie) ? refreshCookie.join('; ') : String(refreshCookie)
    );

  expect(logoutRes.status).toBe(200);

  const refreshAfterLogout = await request(app)
    .post('/api/v1/auth/refresh-token')
    .set('x-csrf-token', csrf.csrfToken)
    .set(
      'Cookie',
      Array.isArray(refreshCookie) ? refreshCookie.join('; ') : String(refreshCookie)
    );

  expect(refreshAfterLogout.status).toBe(401);
});
```

Also add a shared CSRF fixture in the same test file:

```ts
let csrf: { csrfToken: string; cookieHeader: string };

beforeEach(async () => {
  await clearDatabase();
  await seedAdmin();
  csrf = await getCsrfSession();
});
```

- [x] **Step 2: Run the auth test file to verify it fails**

Run:

```bash
npx jest src/__tests__/api/auth/auth.e2e.test.ts --runInBand --verbose
```

Expected:
- FAIL on refresh-token replay test with `Expected: 401, Received: 200`
- FAIL on refresh-after-logout test with `Expected: 401, Received: 200`

- [x] **Step 3: Add CSRF-aware test helpers**

Update `src/__tests__/helpers.ts` with these helpers and make `loginAs()` use them:

```ts
export async function getCsrfSession(): Promise<{
  csrfToken: string;
  cookieHeader: string;
}> {
  const res = await request(app).get('/api/v1/csrf-token').expect(200);

  const cookies = res.headers['set-cookie'];
  if (!cookies) {
    throw new Error('CSRF cookie was not set');
  }

  return {
    csrfToken: res.body.csrfToken as string,
    cookieHeader: Array.isArray(cookies) ? cookies.join('; ') : String(cookies),
  };
}

export async function loginAs(
  email: string,
  password: string
): Promise<{ token: string; user: IUser }> {
  const csrf = await getCsrfSession();

  const res = await request(app)
    .post('/api/v1/auth/login')
    .set('x-csrf-token', csrf.csrfToken)
    .set('Cookie', csrf.cookieHeader)
    .send({ email, password })
    .expect(200);

  const body = res.body as LoginResponse;
  return {
    token: body.data.token,
    user: body.data.user,
  };
}
```

- [x] **Step 4: Implement single-use refresh tokens and logout revocation**

Update `src/api/auth/auth.service.ts`:

```ts
async refreshAuth(refreshToken: string) {
  try {
    const payload = jwt.verify(refreshToken, config.jwt.secret) as {
      sub: string;
      type: string;
      jti?: string;
      exp?: number;
    };

    if (payload.type !== 'refresh') {
      throw new UnAuthorizedError('Invalid token type');
    }

    if (!payload.jti || !payload.exp) {
      throw new UnAuthorizedError('Invalid refresh token');
    }

    if (await this.tokenBlacklist.isRevoked(payload.jti)) {
      throw new UnAuthorizedError('Refresh token has been revoked');
    }

    const ttl = payload.exp - Math.floor(Date.now() / 1000);
    await this.tokenBlacklist.revoke(payload.jti, ttl);

    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnAuthorizedError('User not found');
    }

    return this.generateAuthTokens(user);
  } catch (error) {
    logger.error({ error }, 'Token refresh failed');
    throw new UnAuthorizedError('Please authenticate');
  }
}

async revokeToken(
  token: string,
  expectedType?: 'access' | 'refresh'
): Promise<void> {
  try {
    const payload = jwt.verify(token, config.jwt.secret) as {
      type?: string;
      jti?: string;
      exp?: number;
    };

    if (expectedType && payload.type !== expectedType) {
      return;
    }

    if (payload.jti && payload.exp) {
      const ttl = payload.exp - Math.floor(Date.now() / 1000);
      await this.tokenBlacklist.revoke(payload.jti, ttl);
    }
  } catch {
    // Ignore invalid or expired token during logout/revocation flow
  }
}

async revokeAccessToken(token: string): Promise<void> {
  await this.revokeToken(token, 'access');
}
```

Update `src/api/auth/auth.controller.ts` logout handler:

```ts
async logout(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    await this.authService.revokeAccessToken(authHeader.split(' ')[1]);
  }

  const encryptedRefreshToken = req.cookies.refreshToken as string | undefined;
  if (encryptedRefreshToken) {
    try {
      const refreshToken = decrypt(encryptedRefreshToken);
      await this.authService.revokeToken(refreshToken, 'refresh');
    } catch {
      // Ignore malformed cookie during logout, still clear it below
    }
  }

  res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh-token' });
  new SuccessResponse({ message: 'Logout successfully' }).send(res);
}
```

- [x] **Step 5: Run auth tests to verify they pass**

Run:

```bash
npx jest src/__tests__/api/auth/auth.e2e.test.ts --runInBand --verbose
```

Expected:
- PASS
- replay test returns 401 on second refresh
- logout invalidates the original refresh token

- [x] **Step 6: Commit**

```bash
git add src/api/auth/auth.service.ts src/api/auth/auth.controller.ts src/__tests__/api/auth/auth.e2e.test.ts src/__tests__/helpers.ts
git commit -m "fix(auth): enforce refresh token revocation"
```

### Task 2: Enforce CSRF For Cookie-Based Write Requests

**Files:**
- Modify: `src/middlewares/csrf.middleware.ts:19-31`
- Modify: `src/__tests__/middlewares/csrf.middleware.test.ts:39-69`
- Modify: `src/__tests__/api/auth/auth.e2e.test.ts:30-138`
- Modify: `src/__tests__/helpers.ts:67-89`

- [x] **Step 1: Write the failing middleware and E2E tests**

Update `src/__tests__/middlewares/csrf.middleware.test.ts` by replacing the bypass assertion with:

```ts
it('should NOT skip CSRF when no CSRF token header is present', () => {
  const mockReq: MinimalRequest = {
    headers: {},
  };

  expect(skipCsrfProtection(mockReq)).toBe(false);
});
```

Add this E2E test to `src/__tests__/api/auth/auth.e2e.test.ts`:

```ts
it('should reject login without CSRF token', async () => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

  expect(res.status).toBe(403);
});
```

- [x] **Step 2: Run the focused tests to verify they fail**

Run:

```bash
npx jest src/__tests__/middlewares/csrf.middleware.test.ts src/__tests__/api/auth/auth.e2e.test.ts --runInBand --verbose
```

Expected:
- FAIL because `skipCsrfProtection({ headers: {} })` currently returns `true`
- Existing login tests may also fail until they are updated to send CSRF token and cookie

- [x] **Step 3: Remove the header-omission bypass**

Update `src/middlewares/csrf.middleware.ts` to:

```ts
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
```

- [x] **Step 4: Update auth tests to use the CSRF bootstrap flow**

Use `getCsrfSession()` in all cookie-based POST tests in `src/__tests__/api/auth/auth.e2e.test.ts`. The login happy path should look like this:

```ts
it('should login with valid credentials', async () => {
  const csrf = await getCsrfSession();

  const res = await request(app)
    .post('/api/v1/auth/login')
    .set('x-csrf-token', csrf.csrfToken)
    .set('Cookie', csrf.cookieHeader)
    .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

  expect(res.status).toBe(200);
  expect(res.body.data.user.email).toBe(TEST_ADMIN.email);
  expect(res.body.data.token).toBeDefined();
  expect(res.headers['set-cookie']).toBeDefined();
});
```

The refresh happy path should follow the same pattern, but use the refresh cookie returned by login:

```ts
const refreshRes = await request(app)
  .post('/api/v1/auth/refresh-token')
  .set('x-csrf-token', csrf.csrfToken)
  .set('Cookie', Array.isArray(setCookieHeader) ? setCookieHeader.join('; ') : String(setCookieHeader));
```

- [x] **Step 5: Run the CSRF and auth suites**

Run:

```bash
npx jest src/__tests__/middlewares/csrf.middleware.test.ts src/__tests__/api/auth/auth.e2e.test.ts --runInBand --verbose
```

Expected:
- PASS
- login without CSRF returns 403
- login/refresh/logout with CSRF bootstrap flow still pass

- [x] **Step 6: Commit**

```bash
git add src/middlewares/csrf.middleware.ts src/__tests__/middlewares/csrf.middleware.test.ts src/__tests__/api/auth/auth.e2e.test.ts src/__tests__/helpers.ts
git commit -m "fix(auth): require csrf for cookie requests"
```

### Task 3: Make Bull Board Secure By Default

**Files:**
- Modify: `src/config/env.schema.ts:42-43`
- Modify: `src/config/env.config.ts:35-77`
- Modify: `src/app.ts:85-111`
- Modify: `src/__tests__/config/feature-flags.test.ts:1-53`
- Modify: `README.md:109-111,165-187`
- Modify: `.env.example:49-53`

- [x] **Step 1: Write the failing config test**

Add this test to `src/__tests__/config/feature-flags.test.ts`:

```ts
it('does not provide default Bull Board credentials when omitted', () => {
  delete process.env.BULL_BOARD_USERNAME;
  delete process.env.BULL_BOARD_PASSWORD;

  const config = loadConfig();

  expect(config.bullBoard.username).toBeUndefined();
  expect(config.bullBoard.password).toBeUndefined();
});
```

- [x] **Step 2: Run the config test to verify it fails**

Run:

```bash
npx jest src/__tests__/config/feature-flags.test.ts --runInBand --verbose
```

Expected:
- FAIL because env schema currently defaults both values to `'admin'`

- [x] **Step 3: Remove insecure defaults and gate route mounting**

Update `src/config/env.schema.ts`:

```ts
BULL_BOARD_USERNAME: z.string().min(1).optional(),
BULL_BOARD_PASSWORD: z.string().min(1).optional(),
```

Update `src/config/env.config.ts`:

```ts
interface IConfig {
  database: IDatabaseConfig;
  jwt: IJwtConfig;
  admin: IAdminConfig;
  firebase: IFirebaseConfig;
  redis: IRedisConfig;
  features: IFeatureConfig;
  bullBoard: {
    username?: string;
    password?: string;
  };
  env: string;
  port?: number;
  logLevel: string;
}

const config: IConfig = {
  database: {
    url: env.DATABASE_URL,
    poolSize: 10,
  },
  jwt: {
    secret: env.JWT_SECRET,
    accessExpirationMinutes: env.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: env.JWT_REFRESH_EXPIRATION_DAYS,
  },
  admin: {
    name: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
  },
  firebase: {
    projectId: env.FIREBASE_PROJECT_ID || '',
    clientEmail: env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
  redis: {
    enabled: env.CACHE_ENABLED,
    url: env.REDIS_URL,
  },
  features: {
    jobsEnabled: env.JOBS_ENABLED,
  },
  bullBoard: {
    username: env.BULL_BOARD_USERNAME,
    password: env.BULL_BOARD_PASSWORD,
  },
  env: env.NODE_ENV,
  port: env.PORT,
  logLevel: env.LOG_LEVEL || 'info',
};
```

Update the Bull Board block in `src/app.ts`:

```ts
if (
  config.features.jobsEnabled &&
  config.bullBoard.username &&
  config.bullBoard.password
) {
  const bullBoardAdapter = new ExpressAdapter();
  bullBoardAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: getQueues().map((q) => new BullMQAdapter(q)),
    serverAdapter: bullBoardAdapter,
  });

  app.use(
    '/admin/queues',
    (req: Request, res: Response, next) => {
      const auth = req.headers.authorization;
      if (auth?.startsWith('Basic ')) {
        const [username, password] = Buffer.from(auth.slice(6), 'base64')
          .toString()
          .split(':');

        if (
          username === config.bullBoard.username &&
          password === config.bullBoard.password
        ) {
          return next();
        }
      }

      res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
      res.status(401).send('Authentication required');
    },
    bullBoardAdapter.getRouter()
  );
}
```

- [x] **Step 4: Update docs to require explicit credentials**

Update `.env.example` to remove insecure defaults:

```dotenv
# --- Bull Board (queue monitoring UI at /admin/queues) ---
# Set both values to enable the dashboard
# BULL_BOARD_USERNAME=queue-admin
# BULL_BOARD_PASSWORD=change-me
```

Update README's environment table row to:

```md
| `BULL_BOARD_USERNAME` | Bull Board UI username; mount `/admin/queues` only when set with password | -- |
| `BULL_BOARD_PASSWORD` | Bull Board UI password; mount `/admin/queues` only when set with username | -- |
```

- [x] **Step 5: Run the config test again**

Run:

```bash
npx jest src/__tests__/config/feature-flags.test.ts --runInBand --verbose
```

Expected:
- PASS
- no default `admin/admin` behavior remains in config parsing

- [x] **Step 6: Commit**

```bash
git add src/config/env.schema.ts src/config/env.config.ts src/app.ts src/__tests__/config/feature-flags.test.ts README.md .env.example
git commit -m "fix(config): remove insecure bull board defaults"
```

### Task 4: Align Dev Docker Compose With README Quick Start

**Files:**
- Modify: `docker-compose.yml:44-63`
- Modify: `README.md:23-45,165-187`
- Modify: `.env.example:8-20`

- [x] **Step 1: Write the failing verification step**

Run:

```bash
docker compose config --services
```

Expected current output:
- includes `backend`
- this conflicts with README Quick Start, which tells users to run `npm run docker:up` and then `npm run dev` locally

- [x] **Step 2: Remove the dev backend service from `docker-compose.yml`**

Replace the service section so only `postgres` and `redis` remain. The resulting file should keep these services and remove the current `backend` block entirely:

```yml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-admin}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password123}
      POSTGRES_DB: ${POSTGRES_DB:-backend-template}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'
    healthcheck:
      test:
        [
          'CMD-SHELL',
          'pg_isready -U ${POSTGRES_USER:-admin} -d ${POSTGRES_DB:-backend-template}',
        ]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - backend-network

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - '6379:6379'
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - backend-network
```

- [x] **Step 3: Update Quick Start and Docker docs**

Update `README.md` Quick Start to explicitly say infra-only Docker, then app runs locally:

```md
# Start PostgreSQL and Redis only
npm run docker:up

# Install dependencies
npm install

# Push database schema and seed
npm run db:push
npm run seed:dev

# Start the API locally
npm run dev
```

Update the Docker section service table to remove `backend` from local Compose:

```md
| Service | Port | Purpose |
|---------|------|---------|
| postgres | 5432 | PostgreSQL 16 database |
| redis | 6379 | Redis 7 cache and job queue |
```

Add one sentence below:

```md
The development Compose file starts infrastructure only. Run the API itself with `npm run dev`.
```

- [x] **Step 4: Keep `.env.example` local-dev friendly**

Keep these values as local-host defaults in `.env.example`:

```dotenv
DATABASE_URL=postgresql://admin:password123@localhost:5432/backend-template
REDIS_URL=redis://localhost:6379
```

Add a note immediately below them:

```dotenv
# These localhost URLs are for running the API on your host with `npm run dev`.
# The production Compose file uses internal service hostnames instead.
```

- [x] **Step 5: Run the verification commands**

Run:

```bash
docker compose config --services
```

Expected:
- output contains only `postgres` and `redis`

Run:

```bash
npm run lint
```

Expected:
- PASS

- [x] **Step 6: Commit**

```bash
git add docker-compose.yml README.md .env.example
git commit -m "docs: align local docker quick start"
```

### Task 5: Final Verification

**Files:**
- Test only, no code changes expected

- [x] **Step 1: Run focused regression suites**

Run:

```bash
npx jest src/__tests__/api/auth/auth.e2e.test.ts src/__tests__/middlewares/csrf.middleware.test.ts src/__tests__/config/feature-flags.test.ts --runInBand --verbose
```

Expected:
- PASS

- [x] **Step 2: Run full test suite**

Run:

```bash
npm test
```

Expected:
- PASS

- [x] **Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected:
- PASS

- [x] **Step 4: Review the diff before handing off**

Run:

```bash
git diff -- src/api/auth/auth.service.ts src/api/auth/auth.controller.ts src/middlewares/csrf.middleware.ts src/config/env.schema.ts src/config/env.config.ts src/app.ts src/__tests__/api/auth/auth.e2e.test.ts src/__tests__/middlewares/csrf.middleware.test.ts src/__tests__/config/feature-flags.test.ts src/__tests__/helpers.ts docker-compose.yml README.md .env.example
```

Expected:
- only the planned auth, CSRF, config, compose, and doc changes appear

- [x] **Step 5: Create the final commit**

```bash
git add src/api/auth/auth.service.ts src/api/auth/auth.controller.ts src/middlewares/csrf.middleware.ts src/config/env.schema.ts src/config/env.config.ts src/app.ts src/__tests__/api/auth/auth.e2e.test.ts src/__tests__/middlewares/csrf.middleware.test.ts src/__tests__/config/feature-flags.test.ts src/__tests__/helpers.ts docker-compose.yml README.md .env.example
git commit -m "fix(auth): harden boilerplate security defaults"
```

## Self-Review

**Spec coverage**
- Refresh token replay fixed: Task 1
- Logout revokes refresh token: Task 1
- CSRF bypass removed: Task 2
- Bull Board insecure defaults removed: Task 3
- Docker/README onboarding mismatch fixed: Task 4
- Missing regression tests addressed: Tasks 1, 2, 3, 5

**Placeholder scan**
- No `TODO`, `TBD`, or “write tests for above” placeholders remain.
- Every task includes concrete file paths, commands, expected outcomes, and code snippets.

**Type consistency**
- `revokeToken(token, expectedType)` is defined in Task 1 and reused consistently in the controller.
- `getCsrfSession()` is defined in Task 1 and reused in Task 2.
- `config.bullBoard.username/password` are defined in Task 3 and used consistently in `app.ts`.
