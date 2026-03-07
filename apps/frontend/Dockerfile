# Build context must be the monorepo root so pnpm-lock.yaml is available.
# docker-compose.yml sets: context: . and dockerfile: apps/frontend/Dockerfile

FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app
# Copy workspace manifest files first for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/frontend/package.json ./apps/frontend/

# ── Development stage ────────────────────────────────────────────────────────
FROM base AS development
RUN pnpm install --filter frontend
COPY apps/frontend/ ./apps/frontend/
WORKDIR /app/apps/frontend
EXPOSE 5173
CMD ["pnpm", "run", "dev", "--", "--host"]

# ── Builder stage ─────────────────────────────────────────────────────────────
FROM base AS builder
RUN pnpm install --filter frontend --frozen-lockfile
COPY apps/frontend/ ./apps/frontend/
WORKDIR /app/apps/frontend
RUN pnpm run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM nginx:alpine AS production
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]