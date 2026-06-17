# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Base: Node 20 Alpine with pnpm enabled
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Builder: Install all dependencies and compile TypeScript
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

# Maximize Docker layer caching: only re-fetches if lockfile changes
COPY pnpm-lock.yaml ./
RUN pnpm fetch

# Copy full monorepo and install offline from the pre-fetched store
COPY . .
RUN pnpm install --offline --frozen-lockfile

# Build all workspace packages (Turborepo resolves the dependency graph)
RUN pnpm run build

# Strip devDependencies (TypeScript, ESLint, etc.) for a lean production image
RUN pnpm prune --prod

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — Runner: Minimal production image
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV="production"

# Run as a non-root user for security hardening
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 rewind

# Copy the fully-built and pruned monorepo from the builder stage
COPY --from=builder --chown=rewind:nodejs /app /app

USER rewind

# Document the ports each container may expose (overridden per-service in compose)
EXPOSE 3000 3001 3002

# Default command — overridden by each service in docker-compose.prod.yml
CMD ["pnpm", "start"]
