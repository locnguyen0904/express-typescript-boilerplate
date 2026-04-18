<h1 align="center">Backend Template 🚀</h1>

<p align="center">
  A battle-tested, production-ready Express.js & TypeScript boilerplate with PostgreSQL, Drizzle ORM, and BullMQ.
</p>

<p align="center">
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-24.x-green.svg" alt="Node.js"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-blue.svg" alt="TypeScript"></a>
  <a href="https://opensource.org/licenses/ISC"><img src="https://img.shields.io/badge/License-ISC-blue.svg" alt="License"></a>
  <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express-5.x-lightgrey.svg" alt="Express"></a>
</p>

## 📋 Table of Contents
- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [🛠️ Available Commands](#️-available-commands)
- [📖 Environment Variables](#-environment-variables)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## ✨ Features

- ⚡️ **Modern Stack:** Node.js 24, Express 5, and TypeScript 5.
- 🗄️ **Database & ORM:** PostgreSQL 16 powered by the blazing-fast Drizzle ORM.
- 🔐 **Bulletproof Security:** Helmet, CORS, CSRF protection, and Redis-backed Rate Limiting.
- 🔑 **Authentication:** Robust JWT auth (access & refresh tokens) with token revocation via Redis.
- ✅ **Type-safe Validation:** End-to-end type safety and request validation using Zod.
- 📝 **Auto-generated API Docs:** OpenAPI 3 documentation automatically generated via `zod-to-openapi` and Swagger UI.
- 🚀 **Background Jobs:** Built-in BullMQ integration with Bull Board UI for queue management.
- 🏗️ **Solid Architecture:** Dependency Injection using Inversify and a clear Controller-Service-Repository pattern.
- 📊 **Structured Logging:** Pino logger for JSON-formatted, performant logging.
- 🐳 **Developer Experience:** Fully Dockerized (PostgreSQL, Redis) with Husky git hooks, ESLint, and Prettier.
- 🧪 **Testing:** Configured with Jest and Supertest for Unit and E2E testing.

## Quick Start

```bash
# Clone and setup
git clone <repo-url> my-project
cd my-project
cp .env.example .env

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

The API runs at `http://localhost:3000`. OpenAPI docs are available at `http://localhost:3000/api-docs`.

## Project Structure

```
src/
├── api/                    # Feature modules
│   ├── auth/               # Authentication (login, register, refresh, logout)
│   ├── examples/           # Example CRUD module (reference for new modules)
│   ├── health/             # Health check endpoint
│   ├── users/              # User management
│   └── index.ts            # Route registration
├── common/                 # Shared validation schemas
├── config/                 # Environment config and OpenAPI setup
├── core/                   # Error classes, success responses, pagination
├── db/
│   ├── schema/             # Drizzle table definitions
│   └── seeds/              # Database seed scripts
├── di/                     # Dependency injection (container, tokens)
├── helpers/                # Utility functions (crypto, error handling, response)
├── jobs/                   # Background jobs (queues + workers)
├── middlewares/             # Express middlewares (auth, CSRF, rate limit, logging)
├── services/               # Infrastructure services (database, redis, logger, events)
├── types/                  # Global type declarations
├── app.ts                  # Express app setup
└── server.ts               # Server entry point
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm test` | Run all tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Check for lint errors |
| `npm run lint:fix` | Auto-fix lint errors |
| `npm run prettier:fix` | Format code |
| `npm run db:generate` | Generate Drizzle migration |
| `npm run db:migrate` | Run migrations |
| `npm run db:push` | Push schema to database (dev) |
| `npm run db:studio` | Open Drizzle Studio UI |
| `npm run seed:dev` | Seed database (dev) |
| `npm run docker:up` | Start Docker services |
| `npm run docker:down` | Stop Docker services |

## Environment Variables

Copy `.env.example` to `.env` and adjust values. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://admin:password123@localhost:5432/backend-template` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing key (min 32 chars) | -- |
| `JWT_ACCESS_EXPIRATION_MINUTES` | Access token TTL | `30` |
| `JWT_REFRESH_EXPIRATION_DAYS` | Refresh token TTL | `30` |
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |
| `LOG_LEVEL` | Pino log level | `debug` |
| `CACHE_ENABLED` | Enable Redis caching | `true` |
| `JOBS_ENABLED` | Enable BullMQ workers | `true` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | -- |
| `BULL_BOARD_USERNAME` | Bull Board UI username; mount `/admin/queues` only when set with password | -- |
| `BULL_BOARD_PASSWORD` | Bull Board UI password; mount `/admin/queues` only when set with username | -- |

## 🏗️ Architecture

```mermaid
graph TD
    Client([Client Request]) --> Routes[Express Routes / Zod Validation]
    Routes --> Middleware[Middlewares: Auth, RateLimit, CSRF]
    Middleware --> Controller[Controller]
    Controller --> Service[Business Logic Service]
    Service --> Repository[Data Repository / Drizzle ORM]
    Service --> Redis[(Redis Cache/Jobs)]
    Repository --> DB[(PostgreSQL)]
```

### Layer Responsibilities

| Layer | Responsibility | Depends On |
|-------|---------------|------------|
| **Routes** | HTTP routing, request validation (Zod) | Controller |
| **Controller** | Parse request, format response | Service |
| **Service** | Business logic, orchestration | Repository |
| **Repository** | Data access via Drizzle ORM | Database |

Each feature module in `src/api/` follows this pattern. The `examples` module is a complete reference implementation.

## Creating a Module

Follow the `src/api/examples/` module as a reference. Each module needs:

| File | Purpose |
|------|---------|
| `src/db/schema/<name>s.ts` | Drizzle table definition |
| `src/api/<name>/<name>.interface.ts` | TypeScript types |
| `src/api/<name>/<name>.validation.ts` | Zod request schemas |
| `src/api/<name>/<name>.repository.ts` | Database queries |
| `src/api/<name>/<name>.service.ts` | Business logic |
| `src/api/<name>/<name>.controller.ts` | Request handlers |
| `src/api/<name>/<name>.doc.ts` | OpenAPI documentation |
| `src/api/<name>/index.ts` | Route definitions |

Registration steps:

1. Export schema from `src/db/schema/index.ts`
2. Add DI tokens to `src/di/tokens.ts`
3. Register bindings in `src/di/container.ts`
4. Register routes in `src/api/index.ts`

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npx jest src/__tests__/api/users/user.e2e.test.ts --verbose
```

Test files live in `src/__tests__/`, mirroring the source structure. E2E tests (`.e2e.test.ts`) hit the actual API with a test database. Unit tests (`.test.ts`) test isolated logic.

## Docker

Docker Compose provides PostgreSQL and Redis for local development:

```bash
# Start services
npm run docker:up

# Stop services
npm run docker:down

# View running services
docker compose ps
```

Services:

| Service | Port | Purpose |
|---------|------|---------|
| postgres | 5432 | PostgreSQL 16 database |
| redis | 6379 | Redis 7 cache and job queue |

The development Compose file starts infrastructure only. Run the API itself with `npm run dev`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for git workflow, commit conventions, and code standards.

## License

[ISC](LICENSE)
