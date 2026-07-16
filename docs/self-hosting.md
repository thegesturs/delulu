# Self-hosting Delulu

The supported first release uses Docker Compose, PostgreSQL, Clerk, and Cloudflare R2. Generic OIDC and S3-compatible storage are portability milestones, not v1 capabilities.

## Prerequisites

- Docker Engine with Compose v2
- A Clerk application and its issuer, JWT public key, and secret key
- A Cloudflare R2 bucket with API credentials and a public/custom media URL
- OpenSSL to generate the stable P-256 key that signs agent OAuth tokens
- OAuth applications for each social network you enable
- Two public HTTPS origins: one for the app and one for the API

Optional integrations stay inactive when their credentials are absent.

## Install

```bash
cp .env.selfhost.example .env
# Fill every required value, then validate before starting.
docker compose config --quiet
docker compose up -d --build --wait
curl "$NEXT_PUBLIC_API_URL/v1/instance"
```

Configure Clerk callback/origin settings for `APP_BASE_URL`. Configure each social provider's callback URL using the routes described in the provider setup documentation. Never reuse hosted-production credentials for a self-hosted instance.

Generate `AS_SIGNING_KEY_BASE64` once with the command in `.env.selfhost.example`, store it with your other instance secrets, and back it up. Replacing it invalidates agent OAuth access and refresh tokens.

For automatic TLS, set `APP_DOMAIN` and `API_DOMAIN`, then run:

```bash
docker compose -f compose.yaml -f compose.proxy.yaml up -d --build --wait
```

## Architecture

- `app`: authenticated Next.js interface
- `api`: typed API on Node, plus leader-elected maintenance
- `publisher`: PostgreSQL-backed due-job leasing and publication
- `migrate`: one-shot schema migration before other services start
- `postgres`: authoritative state with a persistent volume

`DELULU_DEPLOYMENT_MODE=self_hosted` enables Community entitlements and disables payment operations. `DELULU_PUBLISH_TRANSPORT=postgres` keeps scheduled publishing within the Compose deployment. Authorization, review rules, idempotency, retries, and safety limits remain active.

## Backup and restore

Create an encrypted logical backup and separately preserve the `.env` file in a secrets manager:

```bash
docker compose exec -T postgres pg_dump -U delulu -d delulu -Fc > delulu.dump
```

Restore into a stopped/fresh application database:

```bash
docker compose stop app api publisher
docker compose exec -T postgres dropdb -U delulu --if-exists delulu
docker compose exec -T postgres createdb -U delulu delulu
docker compose exec -T postgres pg_restore -U delulu -d delulu --clean --if-exists < delulu.dump
docker compose up -d --wait
```

R2 objects are not contained in the database backup. Enable bucket versioning or an independent object backup policy.

## Upgrade

1. Read release notes and take a database backup.
2. Pull the desired version or pin commit-addressed images.
3. Run `docker compose build --pull`.
4. Run `docker compose up -d --wait`; the one-shot migration must finish before app services start.
5. Verify `/v1/instance`, create a test schedule, and inspect `docker compose logs api publisher`.

Rollback application images only after checking migration compatibility. Restore the matching database backup when a migration is not backward-compatible.

## Operations

Use `docker compose ps` for health and `docker compose logs --since=15m api publisher` for runtime failures. Rotate Clerk, R2, social-provider, and encryption credentials using the provider procedure; changing `ENCRYPTION_SECRET` without re-encrypting stored tokens makes existing connections unreadable. Keep the agent OAuth signing key stable across upgrades and restores.

Report vulnerabilities privately according to [SECURITY.md](../SECURITY.md). Community support is described in [SUPPORT.md](../SUPPORT.md).
