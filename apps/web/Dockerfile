# Required: docker login dhi.io

FROM dhi.io/bun:1-alpine3.22-dev AS base
WORKDIR /repo

ENV DO_NOT_TRACK=1
ENV TURBO_TELEMETRY_DISABLED=1

FROM base AS pruner

COPY . .

RUN bunx turbo@2.5.6 prune @repo/web --docker

FROM base AS installer

COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/patches ./patches

RUN --mount=type=cache,target=/root/.bun/install/cache \
	bun install --frozen-lockfile --ignore-scripts

FROM installer AS builder

ARG VITE_CONVEX_URL
ARG VITE_CONVEX_SITE_URL

ENV VITE_CONVEX_URL=${VITE_CONVEX_URL}
ENV VITE_CONVEX_SITE_URL=${VITE_CONVEX_SITE_URL}

COPY --from=pruner /repo/out/full/ ./
RUN bunx turbo@2.5.6 run build --filter=@repo/web

FROM dhi.io/bun:1-alpine3.22 AS runner
WORKDIR /app

ENV DO_NOT_TRACK=1
ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV PORT=8080
ENV TURBO_TELEMETRY_DISABLED=1

COPY --from=builder /repo/apps/web/.output ./.output

EXPOSE 8080

CMD ["bun", "run", ".output/server/index.mjs"]
