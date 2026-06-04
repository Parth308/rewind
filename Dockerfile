FROM node:20-alpine AS base

# Setup pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app

# 1. Maximize Docker caching: Fetch dependencies first (only reruns if pnpm-lock.yaml changes)
COPY pnpm-lock.yaml ./
RUN pnpm fetch

# 2. Copy the rest of the monorepo and install offline
COPY . .
RUN pnpm install --offline --frozen-lockfile

# 3. Build all workspaces
RUN pnpm run build

# 4. Strip devDependencies (like typescript, eslint) to drastically shrink image size
RUN pnpm prune --prod

FROM base AS runner
WORKDIR /app
ENV NODE_ENV="production"

# 5. Copy the fully built and pruned monorepo into the lightweight runner image
COPY --from=builder /app /app

# Default command (overridden in docker-compose)
CMD ["pnpm", "start"]
