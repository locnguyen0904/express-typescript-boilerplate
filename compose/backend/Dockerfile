# Dockerfile for backend with multi-stage build
# Usage:
#   Local: docker build --target development -t backend:dev .
#   Prod:  docker build --target production -t backend:prod .

FROM node:24-alpine AS base

# Patch OS-level CVEs by upgrading Alpine packages in the base image
RUN apk upgrade --no-cache

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 app && \
    adduser -u 1001 -G app -h /home/app -D app

WORKDIR /home/app/backend-template

# Set ownership of the working directory
RUN chown -R app:app /home/app/backend-template

# Copy package files
COPY --chown=app:app package*.json ./

# Development stage
FROM base AS development

USER app

# Install all dependencies (including dev dependencies)
RUN npm install

# Note: .env file will be bind-mounted from host via docker-compose volume

# Expose development ports (app + debugger)
EXPOSE 3000 9229

# Use dumb-init to handle signals properly
CMD ["dumb-init", "npm", "run", "dev"]

# Builder stage - compiles TypeScript
FROM base AS builder

USER app

# Install all dependencies
RUN npm ci

# Copy source code
COPY --chown=app:app . .

# Build the application
RUN npm run build

# Production dependencies stage
FROM base AS prod-dependencies

USER app

# Install only production dependencies
RUN npm ci --omit=dev

# Production stage
FROM base AS production

WORKDIR /home/app/backend-template

USER app

# Copy production dependencies
COPY --chown=app:app --from=prod-dependencies /home/app/backend-template/node_modules ./node_modules

# Copy built application
COPY --chown=app:app --from=builder /home/app/backend-template/dist ./dist

# Copy package.json for metadata
COPY --chown=app:app package.json ./

# Set production environment
ENV NODE_ENV=production

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
CMD ["dumb-init", "node", "dist/server.js"]