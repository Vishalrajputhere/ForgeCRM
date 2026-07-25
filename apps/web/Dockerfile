# =============================================================================
# ForgeCRM Web — Dockerfile
# Multi-stage build: development + production
# =============================================================================
# Architecture: Node.js 22 LTS + Next.js (App Router)
# =============================================================================

# ── Base Stage ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base

ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# ── Dependencies Stage ────────────────────────────────────────────────────────
FROM base AS deps

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies
RUN npm ci

# ── Development Stage ─────────────────────────────────────────────────────────
FROM deps AS development

# Copy source code
COPY . .

EXPOSE 3000

# Hot-reload development server
CMD ["npm", "run", "dev"]

# ── Builder Stage ─────────────────────────────────────────────────────────────
FROM deps AS builder

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Copy source code
COPY . .

# Build the Next.js application
RUN npm run build

# ── Production Stage ──────────────────────────────────────────────────────────
FROM base AS production

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000 \
    HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

CMD ["node", "server.js"]
