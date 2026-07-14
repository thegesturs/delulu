# Postgres foundation

This package owns forward-only plain-SQL migrations for the replacement backend.

Primary and foreign keys are application-generated, entity-prefixed Nano IDs
stored as `text`. Database inserts must provide an ID; PostgreSQL does not
generate fallback identifiers.

Run `pnpm pg:up`, then `pnpm pg:migrate`. `DATABASE_URL` defaults to the local
Postgres 18 container at `postgres://delulu:delulu@localhost:5432/delulu`.

Compose uses a fixed project name (`delulu-db`) and volume (`delulu-postgres`) so
the same container is shared across worktrees and does not depend on the folder
path.

Production and staging databases are provisioned manually. Before M1 routing,
create an isolated staging Postgres database, configure a direct `:5432`
connection for migrations and Hyperdrive, run migrations, and record the
connection ownership and recovery procedure. Production routing remains on the
current backend until the M6 cutover.

## Production migrations

The existing API Workers Build owns production ordering. In the API Worker's
Cloudflare dashboard, open **Settings → Build** and set:

- Root directory: `apps/api`
- Build command: `pnpm build:cloudflare`
- Deploy command: `pnpm deploy`

On the **production/main build trigger only**, add `PRODUCTION_DATABASE_URL` as
a build secret and `PRODUCTION_DATABASE_HOST` as a build variable. Do not expose
either value to preview builds. The URL must use the direct TLS PostgreSQL host
on port `5432` rather than a transaction pooler, and the host variable must
exactly match its hostname. These are build-only values, not Worker runtime
secrets.

Set the production branch to `main` and trigger the API build on every `main`
push. If path filters are required, they must include `apps/api/**`,
`packages/db/**`, `scripts/*production-migration*`,
`scripts/validate-production-database-url.mjs`, `package.json`, and
`pnpm-lock.yaml`; otherwise a migration-only change could be skipped.

Workers Builds supplies `WORKERS_CI_BRANCH`. Preview branches skip production
migrations. On `main`, the build command validates the target and applies
pending migrations before Cloudflare runs the deploy command. A failed migration
therefore prevents the API deployment. The migration ledger makes reruns
idempotent, while GitHub CI continues to lint migrations and exercise them
against disposable PostgreSQL before merge.

Because the schema changes before the new Worker is promoted, every migration
must remain compatible with the currently deployed API. Use expand/contract
releases: add and backfill first, deploy code that no longer depends on the old
shape, then remove it in a later release. Migration lint rejects common
destructive statements unless the later contract migration includes a reviewed
`-- deployment-safe-contract: reason` marker.
