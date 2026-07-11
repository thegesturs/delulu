# @delulu/migrate-convex

One-off **Convex → Postgres** migration CLI and verification suite for the
backend revamp (milestone **M5**). Reads a `npx convex export` snapshot,
transforms it in memory, and writes to Postgres directly via `@effect/sql-pg`
(not through the Workers HTTP path). Idempotent by reload.

> Spec: `specs/backend-revamp/README.md` §4.3–4.7. This package is intentionally
> self-contained — it re-declares the legacy Convex shapes (`src/legacy/`) so it
> survives deletion of the `@delulu/database` package after the soak.

## Commands

```bash
# No DB — counts, unknown tables, decode errors (dry-run triage)
migrate-convex inspect --snapshot export.zip

# transform → truncate-load → reconcile → rebuild-index; writes the manifest
migrate-convex run     --snapshot export.zip [--confirm-database <host>]

# 8-check verification suite (non-zero exit on failure)
migrate-convex verify  --snapshot export.zip [--sample-size 50] [--allow diffs.json]

# role-mapping / ownership / edge-case markdown (read-only, no DB)
migrate-convex report  --snapshot export.zip

# standalone automation_trigger_index rebuild (runbook §4.7 step 4)
migrate-convex rebuild-index
```

Run via pnpm during development:

```bash
DATABASE_URL=… ENCRYPTION_SECRET=… pnpm --filter @delulu/migrate-convex \
  exec tsx src/main.ts run --snapshot export.zip
```

### Environment

- `DATABASE_URL` — direct `:5432` connection (defaults to the local docker harness).
- `ENCRYPTION_SECRET` — required by `verify` only (token spot-check). No plaintext
  token is ever materialized by the pipeline (§4.3); ciphertext is copied verbatim.

### Safety

`run` refuses to touch a non-local database unless `--confirm-database <host>`
matches the `DATABASE_URL` host, and asserts the schema is at the expected
migration head before truncating. It prints the truncate list every run.

## Verification suite (§4.6)

A single PASS/FAIL summary over 8 checks; any failure exits non-zero:

1. **Row-count parity** — per table vs snapshot, adjusted by disposition + manifest counters.
2. **FK integrity + orphan scan** — hard FKs plus soft refs (target→group, MediaRef→media, pendingPostIds→post).
3. **#147 invariants** — stored status equals the recomputed status; content graph valid; pending scheduled targets have jobs; settings decode against `PlatformSettings` matching the connection platform.
4. **Sampled deep-equality** — re-transform independently and field-compare against the DB by `legacy_convex_id`.
5. **Token spot-check** — decrypt one ciphertext per platform with `TokenCipher` (fails, not skips, without `ENCRYPTION_SECRET`).
6. **Quota seed** — reconciliation is a no-op; recomputed counters match the carried `users.usage` values (document accepted diffs via `--allow`).
7. **Ownership audit** — every migrated dual-ownership row lands in its intended workspace (org → clerk-org workspace, user → personal workspace); zero fallthrough.
8. **Role-mapping audit** — `organizationMembers` → `workspace_members` role table is mechanically verified and emitted for human review; nobody lands `viewer` implicitly.

### `--allow` file

```json
{ "quotaDiffs": ["clerk_user_abc", "clerk_user_def"] }
```

`quotaDiffs` lists the **Clerk external ids** whose check-6 counter diffs are
accepted (documented) rather than failing.

## Green-twice workflow (M5 exit criterion)

Rehearse against a **production export** on staging Postgres until verification
is green **twice back-to-back from the same snapshot**. Because `run` truncates
and reloads, run #2 is the idempotency proof.

```bash
export DATABASE_URL=…            # staging Postgres (non-local → needs --confirm-database)
export ENCRYPTION_SECRET=…       # same secret as production
npx convex export --path export.zip

migrate-convex run    --snapshot export.zip --confirm-database <host>
migrate-convex verify --snapshot export.zip            # green
migrate-convex run    --snapshot export.zip --confirm-database <host>
migrate-convex verify --snapshot export.zip            # green again
migrate-convex report --snapshot export.zip            # sign off role + ownership
```

Sign off the role-mapping report and any provider-collision resolutions. Two
consecutive greens + signed reports = M5 done.

## Cutover (runbook §4.7)

The rehearsed script; step 3 is `run`, step 4 is `rebuild-index` (KV
write-through is handled by the M3 services, out of this CLI's scope).

## Local end-to-end

```bash
pnpm --filter @delulu/db pg:up        # postgres:18
pnpm --filter @delulu/db pg:migrate   # schema to head
pnpm --filter @delulu/migrate-convex test              # unit
pnpm --filter @delulu/migrate-convex test:integration  # needs the DB above
```

## Package layout

```
src/
  main.ts            CLI (effect/unstable/cli) — inspect / run / verify / report / rebuild-index
  config.ts pg.ts    env + PgClient layer
  snapshot/          ZIP → per-table JSONL (fflate) + table disposition
  legacy/            throwaway Effect schemas mirroring Convex shapes + decode
  idmap.ts           convexId → Nano ID per entity
  transform/         pure per-domain transforms + ownership resolver + pipeline
  load/loader.ts     one transaction: truncate + batched inserts in FK order
  reconcile.ts       post-load quota reconciliation (mirrors the M4 service)
  rebuild-index.ts   automation_trigger_index rebuild (mirrors indexAutomation)
  verify/            8 checks + runner
  report.ts manifest.ts
test/fixtures/       synthetic snapshot builder + golden dataset
test/unit/ test/integration/
```
