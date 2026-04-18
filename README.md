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

## 🚀 Quick Start

Get up and running locally in seconds.

```bash
# 1. Clone the repository
git clone <repo-url> my-project
cd my-project

# 2. Setup environment variables
cp .env.example .env

# 3. Start infrastructure (PostgreSQL & Redis)
npm run docker:up

# 4. Install dependencies
npm install

# 5. Push schema and seed database
npm run db:push
npm run seed:dev

# 6. Start the API in development mode
npm run dev
```

> **Note:** The API will be available at `http://localhost:3000`. API documentation can be found at `http://localhost:3000/api-docs`.

## 📁 Project Structure

```text
src/
├── api/          # Feature modules (auth, users, examples)
├── common/       # Shared validation schemas
├── config/       # Environment & OpenAPI setup
├── core/         # Core classes (Errors, Pagination, Responses)
├── db/           # Drizzle schemas and seeders
├── di/           # Dependency Injection setup
├── helpers/      # Utility functions
├── jobs/         # BullMQ queues and workers
├── middlewares/  # Express middlewares
├── services/     # Global infrastructure services
├── types/        # TypeScript type declarations
└── server.ts     # Application entry point
```

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot-reload (tsx) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run production build |
| `npm test` | Run all tests (Jest) |
| `npm run lint:fix` | Auto-fix ESLint errors |
| `npm run prettier:fix`| Format codebase |
| `npm run db:push` | Sync schema to database |
| `npm run docker:up` | Spin up Postgres & Redis |

## 📖 Environment Variables

Make sure to adjust the values in your `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://admin:password123@localhost:5432/backend-template` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing key (min 32 chars) | -- |
| `PORT` | API Server port | `3000` |
| `CACHE_ENABLED` | Enable Redis caching | `true` |
| `JOBS_ENABLED` | Enable BullMQ workers | `true` |

## 🤝 Contributing

Contributions are always welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) guide before submitting pull requests.

If you found this project helpful, please consider giving it a ⭐️!

## 📄 License

This project is licensed under the [ISC License](LICENSE).
