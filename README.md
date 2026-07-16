# Delulu

Open-source social scheduling infrastructure for AI agents.

Delulu gives people and agents one permission-aware system for preparing media,
drafting, scheduling, publishing, reviewing, and inspecting social content across
Instagram, Facebook, X, LinkedIn, TikTok, Pinterest, Threads, YouTube, Bluesky,
and Farcaster.

[Documentation](https://docs.delulu.social) ·
[Agent setup](https://docs.delulu.social/getting-started/agent-setup/) ·
[Hosted app](https://solulu.delulu.social) ·
[Self-hosting](./docs/self-hosting.md)

## Why Delulu

- **Agent-native interfaces:** hosted MCP, a deterministic CLI with a packaged
  agent skill, and a typed REST API.
- **Human control:** delegated OAuth scopes, live workspace roles, optional post
  reviews, and revocable credentials.
- **Reliable publishing:** explicit draft/schedule/publish intent, durable
  operation identity, target-level results, retries, and partial-failure states.
- **Complete workflow:** media preparation, multi-network publishing, analytics,
  collaboration, and programmable automations.
- **Open source:** AGPL-3.0 licensed, with a supported Docker Compose deployment.

## Give an agent access

For a local agent, install the CLI and its packaged skill:

```bash
npm install --global delulu-cli
delulu integrate install
delulu login
```

For a browser-capable MCP client, connect:

```text
https://solulu.delulu.social/mcp
```

The human completes sign-in and approves a workspace plus scopes. The agent
never needs a social password or a pasted bearer token.

See the [agent setup guide](https://docs.delulu.social/getting-started/agent-setup/)
for the complete flow.

## Self-host

The Community deployment unlocks core scheduling, publishing, agent interfaces,
workspaces, reviews, and automations. You pay only for your infrastructure and
external providers.

```bash
cp .env.selfhost.example .env
# Fill the required Clerk, R2, agent-signing, encryption, URL, and provider values.
docker compose up -d
```

The first self-hosted release requires operator-owned Clerk and Cloudflare R2
projects. Generic OIDC and S3-compatible storage are planned portability work;
the application services keep those dependencies behind replaceable boundaries.

Read [docs/self-hosting.md](./docs/self-hosting.md) before exposing an instance
to the internet. It covers required credentials, callbacks, migrations,
health checks, backups, upgrades, and limitations.

## Architecture

```text
human consent ─┐
               ├─ authenticated app ─┐
agent ─ MCP ───┤                     │
agent ─ CLI ───┼─ typed API ─ PostgreSQL ─ publisher ─ social networks
code  ─ REST ──┘          │
                          └─ object storage
```

The Docker deployment runs PostgreSQL, a migration job, the authenticated app,
the API, and a PostgreSQL-backed publisher. The hosted deployment can keep its
edge runtime and queue transport without changing domain behavior.

## Repository layout

```text
apps/
  app/         Authenticated Next.js product
  web/         Public marketing site
  api/         Typed API: edge and Node entrypoints
  docs/        Product, CLI, MCP, and API documentation
  cli/         Agent-first command line interface
  mcp/         MCP server and tool definitions
packages/
  contracts/   Public request, response, and error schemas
  core/        Domain types and policies
  services/    Effect services and use cases
  db/          PostgreSQL migrations and tooling
  worker/      Social publishing runtime
  connections/ Social-provider integrations
```

## Local development

### Prerequisites

- Node.js 22.12 or newer
- pnpm 10.8.0 through Corepack
- Docker

```bash
corepack enable
pnpm install
pnpm pg:up
pnpm pg:migrate
pnpm dev:app+api
```

Focused surfaces:

```bash
pnpm dev:web
pnpm dev:docs
pnpm cli -- --help
pnpm mcp
```

## Verification

```bash
pnpm check
pnpm typecheck
pnpm test
pnpm pg:migration-lint
```

Database integration suites require a migrated PostgreSQL instance. Container
and self-host smoke checks run in CI.

## Contributing and security

Issues and pull requests are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md),
[SECURITY.md](./SECURITY.md), [SUPPORT.md](./SUPPORT.md), and the
[Code of Conduct](./.github/CODE_OF_CONDUCT.md) first.

Please report vulnerabilities privately through GitHub Security Advisories,
not a public issue.

## License

Delulu is licensed under the [GNU Affero General Public License v3.0](./LICENSE).
If you modify it and provide the modified software over a network, the AGPL
requires you to offer the corresponding source to those users.
