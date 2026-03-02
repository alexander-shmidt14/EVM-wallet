# ─── EVM Wallet Development Container ───────────────────────────────
# Multi-stage: base for packages/core, then desktop dev environment
FROM node:20-bookworm-slim AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.6.0 --activate

WORKDIR /workspace

# Copy workspace config first (layer cache)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./

# Copy package.json files for all workspace packages
COPY packages/wallet-core/package.json packages/wallet-core/
COPY packages/ui-tokens/package.json packages/ui-tokens/
COPY apps/desktop/package.json apps/desktop/
COPY apps/mobile/package.json apps/mobile/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy all source code
COPY . .

# Build shared packages
RUN pnpm -F @wallet/wallet-core build && pnpm -F @wallet/ui-tokens build

# ─── Development stage ──────────────────────────────────────────────
FROM base AS dev

# Install tools useful for development
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    jq \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 5173

CMD ["pnpm", "dev"]

# ─── Test stage ─────────────────────────────────────────────────────
FROM base AS test

CMD ["pnpm", "-F", "@app/desktop", "test", "--", "--passWithNoTests", "--ci"]

# ─── Build stage (packages only — Electron needs Windows for exe) ──
FROM base AS build

RUN pnpm -F @app/desktop build:main && pnpm -F @app/desktop build:renderer
