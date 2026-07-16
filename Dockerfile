# syntax=docker/dockerfile:1.7
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.8.0 --activate
WORKDIR /workspace

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps ./apps
COPY packages ./packages
COPY turbo ./turbo
COPY scripts ./scripts
COPY patches ./patches
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm config set store-dir /pnpm/store && \
  pnpm install --frozen-lockfile --ignore-scripts \
    --filter=app... \
    --filter=@delulu/mcp... \
    --filter=@delulu/http-api... \
    --filter=@delulu/worker... \
    --filter=@delulu/db...

FROM dependencies AS app-builder
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL=http://localhost:8787
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_c2VsZi1ob3N0ZWQuY2xlcmsuYWNjb3VudHMuZGV2JA==
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
RUN pnpm --filter=@delulu/client build && pnpm --filter=@delulu/mcp build && pnpm --filter=app build

FROM dependencies AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

FROM app-builder AS app
ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "--filter=app", "start"]

FROM runtime AS api
EXPOSE 8787
CMD ["pnpm", "--filter=@delulu/http-api", "start:node"]

FROM runtime AS publisher
CMD ["pnpm", "--filter=@delulu/worker", "start"]

FROM runtime AS migrate
CMD ["pnpm", "--filter=@delulu/db", "pg:migrate"]
