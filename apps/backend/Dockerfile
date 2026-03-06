# Build context must be the monorepo root so pnpm-lock.yaml is available.
# docker-compose.yml sets: context: . and dockerfile: apps/backend/Dockerfile

FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app
# Copy workspace manifest files first for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/

# ── Development stage ────────────────────────────────────────────────────────
FROM base AS development
RUN pnpm install --filter backend
COPY apps/backend/ ./apps/backend/
WORKDIR /app/apps/backend
EXPOSE 9940
CMD ["pnpm", "run", "dev"]

# ── Builder stage ─────────────────────────────────────────────────────────────
FROM base AS builder
RUN pnpm install --filter backend --frozen-lockfile
COPY apps/backend/ ./apps/backend/
WORKDIR /app/apps/backend
RUN pnpm run build
# Copy SQL migration files into dist so migrate.js can find them at runtime
RUN cp -r src/db/migrations dist/db/migrations

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS production
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
RUN pnpm install --filter backend --prod --frozen-lockfile
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
WORKDIR /app/apps/backend
EXPOSE 9940
CMD ["node", "dist/server.js"]
