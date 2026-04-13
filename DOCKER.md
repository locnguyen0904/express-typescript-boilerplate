# Docker Guide

This project uses multi-stage Dockerfiles to support both local development and production environments.

## Architecture

- **compose/backend/Dockerfile** - Multi-stage backend Dockerfile with `development` and `production` targets
- **docker-compose.yml** - Base/shared configuration (images, healthchecks, volumes)
- **docker-compose.override.yml** - Development overrides (auto-loaded with `docker compose up`)
- **docker-compose.prod.yml** - Production overrides (resource limits, logging, prod targets)

## Local Development

### Start all services

```bash
docker compose up -d
```

### Build specific service

```bash
docker compose build backend
```

### View logs

```bash
docker compose logs -f backend
```

### Stop all services

```bash
docker compose down
```

### Clean up (remove volumes)

```bash
docker compose down -v
```

## Production Deployment

### Prerequisites

1. Copy environment variables:

```bash
cp .env.prod.example .env.prod
```

2. Edit `.env.prod` with your production values:
   - Set a secure JWT secret (at least 32 characters)
   - Update DATABASE_URL if using external database

3. Generate MongoDB keyfile:

```bash
npm run generate:mongo-key
```

> **Linux production note:** The MongoDB keyfile must be readable by the `mongodb` user (UID 999) inside the container. After generating, fix ownership:
>
> ```bash
> sudo chown 999:999 compose/mongo/keys/keyfile.local
> ```
>
> This is not required on Docker Desktop (macOS/Windows) which handles file permissions transparently.

4. Set up Cloudflare Origin Certificate:
   1. In Cloudflare dashboard, go to SSL/TLS and set encryption mode to **Full (strict)**
   2. Go to SSL/TLS > Origin Server > Create Certificate
   3. Save the certificate and private key to:

```bash
mkdir -p compose/nginx/ssl
# Paste certificate content into cert.pem
# Paste private key content into key.pem
chmod 600 compose/nginx/ssl/*.pem
```

- Certificate: `compose/nginx/ssl/cert.pem`
- Private key: `compose/nginx/ssl/key.pem`
- Origin Certificates last up to 15 years

5. Create secret files for production passwords:

```bash
mkdir -p secrets
echo "your-mongo-password" > secrets/mongo_root_password.txt
echo "your-redis-password" > secrets/redis_password.txt
chmod 600 secrets/*.txt
```

### Start production services

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d
```

### Build production images

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
```

### View production logs

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

### Stop production services

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

## CD Pipeline (GitHub Actions + GHCR)

### Overview

The CD pipeline (`.github/workflows/cd.yml`) automatically builds and pushes Docker images to GitHub Container Registry (GHCR) on every push to `main` or version tag (`v*`).

**Triggers:**

- Push to `main` branch → builds and pushes with `latest` + `sha-<commit>` tags
- Push `v*` tag (e.g., `v1.2.3`) → builds and pushes with semver + `sha-<commit>` tags

**Images:**

- `ghcr.io/<owner>/backend-template-backend`

**Tagging strategy:**

| Trigger        | Tags Applied                  |
| -------------- | ----------------------------- |
| Push to `main` | `latest`, `sha-abc1234`       |
| Tag `v1.2.3`   | `1.2.3`, `1.2`, `sha-abc1234` |

### GitHub Repository Setup

1. **Enable GitHub Packages** for the repository (Settings > Packages)

2. **Set default GITHUB_TOKEN permissions** to read-only (Settings > Actions > General > Workflow permissions). The CD workflow explicitly requests `packages: write`.

3. **Verify CI passes** before merging to main — the existing CI workflow (`.github/workflows/ci.yml`) handles lint, test, and security scanning on PRs.

### Pulling Images from GHCR

```bash
# Authenticate to GHCR (one-time on VPS)
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Pull latest images
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod pull

# Start services with pulled images
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d
```

### Rollback

Every image push includes an immutable `sha-<commit>` tag. To rollback:

```bash
# 1. Find the last known good commit SHA from GHCR or git log
ROLLBACK_SHA=sha-abc1234
OWNER=locnguyen  # your GitHub username or org

# 2. Pull the specific SHA-tagged image
docker pull ghcr.io/$OWNER/backend-template-backend:$ROLLBACK_SHA

# 3. Retag as :latest so docker compose uses it
docker tag ghcr.io/$OWNER/backend-template-backend:$ROLLBACK_SHA ghcr.io/$OWNER/backend-template-backend:latest

# 4. Restart services (no pull — uses locally tagged images)
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d
```

### Build Caching

The CD workflow uses GitHub Actions cache (`type=gha, mode=max`) with per-service scoping. Cached builds typically complete in under 3 minutes per service.

## Docker Build Targets

### Backend

**Development target:**

```bash
docker build --target development -f compose/backend/Dockerfile -t backend:dev .
```

- Uses nodemon for hot reload
- Includes dev dependencies
- Exposes debugger port 9229
- Source code mounted as volume

**Production target:**

```bash
docker build --target production -f compose/backend/Dockerfile -t backend:prod .
```

- Compiled TypeScript (dist folder)
- Only production dependencies
- Optimized image size
- Includes health checks
- Uses dumb-init for proper signal handling

## Port Mapping

### Development

- Backend: `localhost:3000`
- Backend Debugger: `localhost:9229`
- MongoDB: `localhost:27017`
- Redis: `localhost:6379`

### Production

- Nginx (HTTPS via Cloudflare): `localhost:443`
- Backend: Internal only (proxied via nginx at `/api/*`)
- MongoDB: Internal only (backend-network)
- Redis: Internal only (backend-network)

## Volume Management

### Development Volumes

- `node_modules` - Dependencies (persisted via Docker volume)
- `mongo_data` - MongoDB data
- Source code directories are bind-mounted for live reload

### Production Volumes

- `mongo_data` - MongoDB data (persistent, backup priority: critical)
- `redis_data` - Redis persistence data (backup priority: medium)
- No source code volumes (built into images)

## Best Practices

1. **Security**
   - Never commit `.env.prod` file
   - Use strong passwords in production
   - Restrict database ports in production (don't expose to host)
   - Use secrets management in production (Docker secrets, vault, etc.)

2. **Image Optimization**
   - Multi-stage builds reduce final image size
   - Production images only contain necessary files
   - Layer caching optimizes build time

3. **Health Checks**
   - Backend includes HTTP health check
   - Database services include ping health checks

4. **Logging**
   - Production uses JSON file driver with rotation
   - Maximum 3 log files of 10MB each

## Troubleshooting

### Backend not starting

```bash
docker compose logs backend
# Check environment variables
docker compose exec backend env
```

### Database connection issues

```bash
# Check MongoDB health
docker compose exec mongo mongosh --eval "db.adminCommand('ping')"
```

### Database connection issues

```bash
# Check MongoDB health
docker compose exec mongo mongosh --eval "db.adminCommand('ping')"
```

### Permission issues

```bash
# All containers run as non-root user (app:1001)
# Check file ownership if mounting volumes
```

## Advanced Usage

### Run specific command in container

```bash
docker compose exec backend npm run test
docker compose exec backend npm run lint
```

### Access container shell

```bash
docker compose exec backend sh
docker compose exec mongo mongosh
```

### Rebuild specific service

```bash
docker compose up -d --build backend
```

### Scale services (production)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale backend=3
```

Note: Requires load balancer configuration for proper traffic distribution.
