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

This is `convex deploy -y && convex run migrations:runAll --prod`. Run it every time you ship.
It's safe to run repeatedly: already-applied migrations are no-ops.

Other commands (run from repo root):

```bash
pnpm db:migrate          # run pending migrations against prod (no deploy)
pnpm db:migrate:status   # live status of every migration (completed / in-progress / cursor)
pnpm db:migrate:dry      # dry-run: shows what would change, writes nothing
```

Against the dev deployment, use the package scripts directly:

```bash
pnpm --filter=@delulu/database db:deploy:dev   # deploy + migrate the dev deployment
pnpm --filter=@delulu/database db:migrate      # migrate dev only
```

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

Never change a validator and the data it describes in the same deploy, or the schema and the
existing rows disagree and writes fail. Split it across deploys:

1. **Expand** — make the schema tolerant. Add the new field as `v.optional(...)`, or make the
   old field optional. Deploy.
2. **Migrate** — a `migrations.define` backfills the new field / rewrites old values / clears
   the removed one. Ships in `runAll`, runs on deploy.
3. **Contract** — once the migration reports complete (`pnpm db:migrate:status`), tighten the
   validator (make the new field required, drop the old field). Deploy.

## Rules

- **Append-only.** Add new migrations to the end of `runAll`; never reorder or delete ones that
  have run in prod. They stay as history and never re-execute once complete.
- **Idempotent.** Guard every write so re-running is a no-op.
- **Row-oriented.** Use `migrateOne` over a table. For one-off recovery that isn't a per-row
  transform (e.g. rebuilding an aggregate), keep a plain `internalMutation` (see
  `convex/repairs.ts`) and run it by hand — don't put it in `runAll`.
- **Test with `db:migrate:dry`** before running for real.
