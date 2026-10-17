# Stage 1: Pruner - Extract workspace subset using Turborepo
FROM node:22-bookworm-slim AS pruner
WORKDIR /app
RUN npm install -g turbo@^2.5.0
COPY . .
RUN turbo prune @nutrigon/api --docker

# Stage 2: Builder - Install dependencies and build contracts + API
FROM node:22-bookworm-slim AS builder
WORKDIR /app

ENV CI=true
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@10.28.2 turbo@^2.5.0

# Copy lockfile and package manifests for layer caching
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Copy source code and build
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@nutrigon/api...

# Stage 3: Runner - Minimal unprivileged production image
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy pruned workspace dependencies and built artifacts with non-root ownership
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/packages ./packages
COPY --from=builder --chown=node:node /app/apps/api ./apps/api
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

USER node

WORKDIR /app/apps/api

EXPOSE 3000

# Native healthcheck using Node 22 fetch without external CLI dependencies
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3000) + '/api/v1/health').then(r => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1))"

CMD ["node", "dist/main.js"]
