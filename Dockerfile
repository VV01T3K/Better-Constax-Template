# Required: docker login dhi.io

FROM dhi.io/bun:1-alpine3.22-dev AS builder
WORKDIR /build

ARG VITE_CONVEX_URL
ARG VITE_CONVEX_SITE_URL

COPY package.json bun.lock* turbo.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/convex/package.json ./apps/convex/package.json
COPY patches ./patches

# Install deps with cache mount (BuildKit required)
RUN --mount=type=cache,target=/root/.bun/install/cache \
   bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM dhi.io/bun:1-alpine3.22 AS runner
WORKDIR /app

COPY --from=builder /build/apps/web/.output ./.output

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

EXPOSE 8080

CMD ["bun", "run", ".output/server/index.mjs"]
