# Delulu Social

Social media management tool with Instagram auto-DM, multi-platform scheduling, org workspaces, AI agent API, and post approval workflows.

## Convex schema — single source of truth

All Convex schema, enums, and validators live in **one place**. Do not duplicate.

- **Enums & shared validators:** `packages/database/convex/schemas/enums.ts` (or a domain file under `schemas/` re-exported from `schemas/index.ts`)
- **Table field schemas:** `packages/database/convex/schemas/*.ts` — e.g. `posts_media.ts`, `publish.ts`
- **Table registration & indexes:** `packages/database/convex/schema.ts` imports base schemas only

Rules:

1. Define each enum once: `v.union(...)` validator + `as const` object + exported TS type (see `POST_STATUS` in `enums.ts`)
2. Mutation/query `args` and `returns` validators import from `schemas/` — never inline duplicate literals
3. App, API, and worker types import from `@delulu/database/convex/schemas` or `Infer<typeof …>` — not hand-rolled duplicates
4. New publish-pipeline types (`publishJobStatus`, `publishStatus`, etc.) go in `schemas/publish.ts`, exported via `schemas/index.ts`

## Migrations

Data migrations use the `@convex-dev/migrations` component. Full guide:
`packages/database/MIGRATIONS.md`. Rules in short:

- **Deploy prod with `pnpm db:deploy`** — deploys Convex, then runs pending migrations.
  Only migrations not yet completed run; it's safe to re-run.
- Define each migration in `convex/migrations.ts` via `migrations.define({ table, migrateOne })`,
  make it **idempotent**, and **append** its ref to the `runAll` array (append-only — never
  reorder or delete existing entries).
- Field changes/removals follow **expand → migrate → contract** across separate deploys, never
  in one.
- One-off recovery that isn't a per-row transform stays a plain `internalMutation` in
  `convex/repairs.ts` and is run by hand — not added to `runAll`.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
