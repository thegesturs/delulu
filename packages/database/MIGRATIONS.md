# Database migrations

Delulu uses the [`@convex-dev/migrations`](https://www.convex.dev/components/migrations)
component. It tracks each migration's completion in its own state table, so you can run the
whole set safely on every deploy — **only migrations that haven't finished yet actually run.**
Completed migrations are skipped instantly; interrupted ones resume from their saved cursor.

Everything lives in [`convex/migrations.ts`](./convex/migrations.ts).

## Deploying (the one command)

```bash
pnpm db:deploy          # from repo root — deploys Convex to prod, then runs pending migrations
```

This runs `convex deploy` then `convex run migrations:runAll --prod`, **in that order** —
deploy first, then migrate. Run it every time you ship an additive or data-only change. It's
safe to run repeatedly: already-applied migrations are no-ops.

For **structural** changes (add a required field, remove a field, change a type) use the
two-phase commands instead — see "Changing or removing a field" below:

```bash
pnpm db:deploy:expand    # phase 1: loosen schema, deploy, backfill data
pnpm db:deploy:contract  # phase 2: tighten schema (data already migrated)
```

Other commands (run from repo root):

```bash
pnpm db:migrate          # run pending migrations against prod (no deploy)
pnpm db:migrate:status   # live status of every migration (completed / in-progress / cursor)
pnpm db:migrate:dry      # dry-run: shows what would change, writes nothing
```

Dev deployment: run `convex dev` (watch mode auto-pushes schema + functions), then
`pnpm --filter=@delulu/database db:migrate` to run migrations against dev. There is no
"deploy to dev" — `convex deploy` always targets production.

All three deploy commands go through `scripts/db-deploy.sh`, which prints the expand/contract
fix if `convex deploy` is rejected because the schema no longer matches existing data.

## Adding a new migration

1. **Define it** in `convex/migrations.ts` with `migrations.define(...)`. It runs once per
   document in the table, in batches. Make it **idempotent** — guard your writes so a re-run
   is a no-op:

   ```ts
   export const setDefaultPlan = migrations.define({
     table: "users",
     migrateOne: async (ctx, user) => {
       if (user.plan === undefined) {
         await ctx.db.patch(user._id, { plan: "free" });
       }
     },
   });
   ```

2. **Append it to `runAll`** (append-only — never reorder or delete existing entries):

   ```ts
   export const runAll = migrations.runner([
     internal.migrations.backfillUsageCounters,
     internal.migrations.setDefaultPlan, // 👈 new one at the end
   ]);
   ```

3. **Deploy**: `pnpm db:deploy`. Only `setDefaultPlan` runs; the rest are already complete.

## Changing or removing a field — expand → migrate → contract

**Why you can't do it in one deploy:** `convex deploy` validates your new `schema.ts` against
the data already in the DB. If the schema is stricter than the data (a field just became
required, or a field the rows still carry was removed), the deploy is **rejected before any
migration runs**. Put a tightening schema change and its data migration in the same deploy and
you deadlock: the deploy fails, so the migration that would have fixed the data never executes.

So split every structural change across two deploys. Worked example — split `users.name` into
`firstName` + `lastName`:

**Phase 1 — Expand** (`pnpm db:deploy:expand`). Loosen the schema so it accepts BOTH shapes:

```ts
// schema.ts
name:      v.optional(v.string()),  // old field, now optional
firstName: v.optional(v.string()),  // new, optional
lastName:  v.optional(v.string()),
```
```ts
// migrations.ts — append to runAll
export const splitName = migrations.define({
  table: "users",
  migrateOne: (ctx, u) => {
    if (u.firstName === undefined && u.name) {
      const [first, ...rest] = u.name.split(" ");
      return { firstName: first, lastName: rest.join(" ") };
    }
  },
});
```
The schema is permissive, so the deploy succeeds; then the backfill fills every row.

**Verify** the backfill finished: `pnpm db:migrate:status`.

**Phase 2 — Contract** (`pnpm db:deploy:contract`). Now the data conforms, so tighten:

```ts
// schema.ts
firstName: v.string(),  // required — safe, every row has it
lastName:  v.string(),
// `name` removed
```
```ts
// migrations.ts — append a cleanup that drops the old field (undefined removes it)
export const dropName = migrations.define({
  table: "users",
  migrateOne: (ctx, u) => (u.name !== undefined ? { name: undefined } : undefined),
});
```
`db:deploy:contract` shows migration status first (confirm the expand backfill is complete),
then deploys the strict schema — which validates because the data already matches.

## Rules

- **Append-only.** Add new migrations to the end of `runAll`; never reorder or delete ones that
  have run in prod. They stay as history and never re-execute once complete.
- **Idempotent.** Guard every write so re-running is a no-op.
- **Row-oriented.** Use `migrateOne` over a table. For one-off recovery that isn't a per-row
  transform (e.g. rebuilding an aggregate), keep a plain `internalMutation` (see
  `convex/repairs.ts`) and run it by hand — don't put it in `runAll`.
- **Test with `db:migrate:dry`** before running for real.
