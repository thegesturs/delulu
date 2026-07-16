# Delulu Social

Delulu is a social media management platform: schedule and publish across
Instagram, Facebook, X/Twitter, LinkedIn, TikTok, Pinterest, Threads, YouTube,
Bluesky and Farcaster, automate Instagram DMs, collaborate in org workspaces
with an approval workflow, and drive it all through an AI agent API (MCP).

> **License:** Delulu is source-available under the
> [Functional Source License (FSL-1.1-ALv2)](./LICENSE). You may read, self-host,
> and modify it for any purpose **except** offering a competing hosted service.
> Each release converts to Apache-2.0 two years after it is published.

## Features

- **Multi-platform scheduling & publishing** across 10+ networks
- **Instagram auto-DM** automation
- **Org workspaces** with roles and a post approval workflow
- **Real-time collaboration** on drafts
- **AI agent API** via an MCP server
- **Agent-first CLI** with device authorization, atomic publishing, and TOON output
- **Analytics** and post insights
- **Billing** with subscription plans (multi-currency)

## Tech stack

- **Monorepo** — [Turborepo](https://turbo.build) + [pnpm workspaces](https://pnpm.io)
- **Web** — [Next.js](https://nextjs.org) (App Router), React, a Radix + Tailwind design system
- **Auth** — [Clerk](https://clerk.com)
- **Data / realtime backend** — [Convex](https://convex.dev)
- **Edge & compute** — [Cloudflare Workers](https://workers.cloudflare.com) (Wrangler), R2 storage, KV
- **Payments** — [Dodo Payments](https://dodopayments.com)
- **Email** — [Resend](https://resend.com) + React Email
- **Collaboration** — [Liveblocks](https://liveblocks.io)
- **Notifications** — [Knock](https://knock.app)
- **Analytics** — [PostHog](https://posthog.com)
- **App security** — [Arcjet](https://arcjet.com)
- **Observability** — [Better Stack](https://betterstack.com)
- **Tooling** — [Biome](https://biomejs.dev) / Ultracite, Lefthook, tsup, Vitest

## Repository layout

```
apps/
  app/         Authenticated dashboard (Next.js)
  web/         Marketing site (Next.js)
  api/         Public API (Cloudflare Worker)
  mcp/         MCP server — the AI agent API
  docs/        Documentation site (Astro + Fumadocs)
  cli/         Agent-first command line interface
  email/       Email template workshop (React Email)
  sorted/      Browser extension (WXT)
  storybook/   Component workshop
packages/
  database/    Convex schema & functions
  api/         tRPC routers and social-provider integrations
  auth/        Clerk wrappers
  design-system/  Shared UI components
  payments/    Plans & Dodo Payments product IDs
  worker/      Social publishing Cloudflare Worker
  ...          ai, analytics, email, notifications, collaboration,
               security, storage, webhooks, validators, seo, observability
```

## Getting started

### Prerequisites

- **Node.js** 22.12+
- **pnpm** 10 (`corepack enable` picks up the pinned version)

### Install

```bash
pnpm install
```

### Configure environment

Each app reads its own environment. Copy the examples and fill in credentials
for the third-party services above:

```bash
cp apps/app/.env.example apps/app/.env
cp apps/web/.env.example apps/web/.env
```

At minimum you'll need Clerk and a Postgres database URL to boot the app; the
remaining keys enable individual integrations (payments, social providers,
email, analytics, etc.). Admin-only features read a comma-separated allowlist
from `ADMIN_EMAILS` / `NEXT_PUBLIC_ADMIN_EMAILS`.

### Develop

```bash
pnpm dev          # run everything via Turborepo
pnpm dev:app      # just the dashboard (http://localhost:3000)
pnpm dev:web      # just the marketing site
pnpm dev:api      # just the Postgres-backed API worker
pnpm dev:docs     # documentation site (http://localhost:3004)
```

## Documentation

The full product, CLI, MCP, OAuth, REST API, and architecture documentation
lives in [`apps/docs`](./apps/docs). The docs build generates its OpenAPI 3.1
reference directly from `@delulu/contracts`, so endpoint schemas stay aligned
with the production worker.

```bash
pnpm dev:docs
pnpm --filter @delulu/docs build
```

## Common scripts

| Command            | Description                     |
| ------------------ | ------------------------------- |
| `pnpm build`       | Build all apps and packages     |
| `pnpm typecheck`   | Type-check the whole monorepo   |
| `pnpm test`        | Run the test suites             |
| `pnpm check`       | Lint / format check (Ultracite) |
| `pnpm fix`         | Auto-fix lint & formatting      |
| `pnpm pg:migrate`  | Apply local Postgres migrations |

## Contributing

Issues and pull requests are welcome. Please read the
[Code of Conduct](./.github/CODE_OF_CONDUCT.md) and note that all contributions
are accepted under the terms of the [LICENSE](./LICENSE).

## License

[FSL-1.1-ALv2](./LICENSE) © Delulu Social — converts to Apache-2.0 two years
after each release.
