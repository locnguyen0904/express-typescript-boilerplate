FROM node:24-alpine AS base

RUN apk upgrade --no-cache && apk add --no-cache dumb-init

RUN addgroup -g 1001 app && \
    adduser -u 1001 -G app -h /home/app -D app

WORKDIR /home/app/express-typescript-boilerplate

RUN chown app:app /home/app/express-typescript-boilerplate

COPY --chown=app:app package*.json ./

# ─── Development ──────────────────────────────────────────────────────────────
FROM base AS development

USER app

RUN npm install

EXPOSE 3000 9229

CMD ["dumb-init", "npm", "run", "dev"]

# ─── Builder ──────────────────────────────────────────────────────────────────
FROM base AS builder

USER app

RUN npm ci

COPY --chown=app:app . .

RUN npm run build

# ─── Production dependencies ──────────────────────────────────────────────────
FROM base AS prod-dependencies

USER app

RUN npm ci --omit=dev --ignore-scripts \
    && find node_modules -type d -name '.cache' -exec rm -rf {} + 2>/dev/null || true

# ─── Production ───────────────────────────────────────────────────────────────
FROM base AS production

USER app

COPY --from=prod-dependencies --chown=app:app /home/app/express-typescript-boilerplate/node_modules ./node_modules
COPY --from=builder --chown=app:app /home/app/express-typescript-boilerplate/dist ./dist
COPY --chown=app:app package.json ./

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["dumb-init", "node", "dist/server.js"]
