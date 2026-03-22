# Setup Guide

Detailed instructions for setting up the development environment.

## Prerequisites

| Requirement    | Version  | Check Command            |
| -------------- | -------- | ------------------------ |
| Docker         | >= 20.10 | `docker --version`       |
| Docker Compose | >= 2.0   | `docker compose version` |
| Node.js        | >= 24.0  | `node --version`         |
| npm            | >= 10.0  | `npm --version`          |

## Quick Setup (Docker)

Recommended for most development work.

```bash
# 1. Clone repository
git clone <repo-url> my-project
cd my-project

# 2. Create environment file
cp .env.example .env

# 3. Start all services
docker compose up -d

# 4. Verify services are running
docker compose ps
```

**Expected output:**

```
NAME                       STATUS
backend-template_mongo     running (healthy)
backend-template_redis     running (healthy)
backend-template_backend   running
backend-template_frontend  running
```

## Environment Configuration

### Required Variables

```bash
# .env
DATABASE_URL=mongodb://admin:password123@mongo:27017/backend-template?authSource=admin&replicaSet=rs0
JWT_SECRET=your-secret-key-min-32-chars-long
```

### Optional Variables

```bash
# JWT
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=30

# Redis (for caching)
REDIS_URL=redis://redis:6379

# Server
PORT=3000
NODE_ENV=development

# MongoDB (Docker)
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password123
```

### Environment Differences

| Variable            | Docker  | Local       |
| ------------------- | ------- | ----------- |
| `DATABASE_URL` host | `mongo` | `localhost` |
| `REDIS_URL` host    | `redis` | `localhost` |

## Database Setup

### With Docker (Automatic)

MongoDB is configured as a replica set automatically:

- Replica set name: `rs0`
- Auth enabled with root user
- Data persisted in `mongo_data` volume

### Seed Data

```bash
# Development seed
cd backend && npm run seed:dev
```

### MongoDB Shell Access

```bash
# Connect to MongoDB in Docker
docker compose exec mongo mongosh -u admin -p password123

# Common commands
show dbs
use backend-template
db.users.find()
```

## Local Development (Without Docker)

For working on backend code with hot reload.

### 1. Start Infrastructure Only

```bash
# Start only MongoDB and Redis
docker compose up -d mongo redis

# Verify they're healthy
docker compose ps
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Local Environment

Create `backend/.env`:

```bash
DATABASE_URL=mongodb://admin:password123@localhost:27017/backend-template?authSource=admin&replicaSet=rs0
JWT_SECRET=your-secret-key-min-32-chars-long
REDIS_URL=redis://localhost:6379
PORT=3000
NODE_ENV=development
```

### 4. Start Backend

```bash
npm run dev
```

### 5. Start Frontend (Optional)

```bash
cd frontend
npm install
npm run dev
```

## Verification

### Health Check

```bash
curl http://localhost:3000/health
```

Expected:

```json
{ "status": "ok", "timestamp": "..." }
```

### API Documentation

Open http://localhost:3000/api-docs in browser.

### Run Tests

```bash
cd backend
npm test
```

## Docker Commands Reference

| Command                           | Description             |
| --------------------------------- | ----------------------- |
| `docker compose up -d`            | Start all services      |
| `docker compose down`             | Stop all services       |
| `docker compose down -v`          | Stop and remove volumes |
| `docker compose logs -f backend`  | Follow backend logs     |
| `docker compose restart backend`  | Restart backend         |
| `docker compose exec backend sh`  | Shell into container    |
| `docker compose build --no-cache` | Rebuild images          |

## Troubleshooting

### MongoDB Connection Failed

**Symptom:** `MongoServerError: connection refused`

**Solutions:**

```bash
# 1. Check MongoDB is healthy
docker compose ps

# 2. Wait for replica set initialization (first run)
docker compose logs mongo

# 3. Restart if needed
docker compose restart mongo
```

### Redis Connection Failed

**Symptom:** `Redis connection closed` warnings

**Solutions:**

```bash
# Check Redis is running
docker compose ps

# Application works without Redis (caching disabled)
# To fix, restart Redis
docker compose restart redis
```

### Port Already in Use

**Symptom:** `EADDRINUSE: address already in use`

**Solutions:**

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### TypeScript Errors in Docker

**Symptom:** `Cannot find module` or `sh: tsx: not found`

**Solutions:**

```bash
# Rebuild with fresh node_modules (removes stale named volume)
docker compose down
docker volume rm backend-template_backend_node_modules
docker compose up -d --build
```

> **Why:** Docker uses a named volume for `node_modules` that persists between builds. After changing dependencies, the old volume may not have the new packages.

### Tests Failing

**Symptom:** Tests fail with database errors

**Solutions:**

```bash
# Tests use in-memory MongoDB, no connection needed
# Check for syntax errors first
npm run lint

# Run specific test
npm test -- --testPathPattern=user.service
```

## IDE Setup

### VS Code Extensions

| Extension           | Purpose              |
| ------------------- | -------------------- |
| ESLint              | Linting              |
| Prettier            | Formatting           |
| MongoDB for VS Code | Database browser     |
| Docker              | Container management |
| Thunder Client      | API testing          |

### Settings

`.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

## Next Steps

1. Read [CONTRIBUTING.md](../CONTRIBUTING.md) for Git workflow
2. Read [ARCHITECTURE.md](ARCHITECTURE.md) for design decisions
