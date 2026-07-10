# Postgres foundation

This package owns forward-only plain-SQL migrations for the replacement backend.

Primary and foreign keys are application-generated, entity-prefixed Nano IDs
stored as `text`. Database inserts must provide an ID; PostgreSQL does not
generate fallback identifiers.

Run `pnpm pg:up`, then `pnpm pg:migrate`. `DATABASE_URL` defaults to the local
Postgres 18 container at `postgres://delulu:delulu@localhost:5432/delulu`.

Production and staging databases are provisioned manually. Before M1 routing,
create an isolated staging Postgres database, configure a direct `:5432`
connection for migrations and Hyperdrive, run migrations, and record the
connection ownership and recovery procedure. Production routing remains on the
current backend until the M6 cutover.
