# Agent Review: Publish Pipeline v2

**Status:** Draft  
**Last updated:** 2026-07-04  
**Spec hub:** [`files/index.html`](./files/index.html)

---

## Verdict

**Keep Convex as system of record.** Do not migrate to PlanetScale now. Fix publishing fragility by introducing `publish_jobs` + `publish_attempts` tables in Convex, deriving post status from jobs, and routing worker writes through `apps/api` internal endpoints.

**Effort:** M (~3–4 weeks) for publish pipeline v2. PlanetScale migration = XL (~2–3 months) — deferred.

---

## Scope

### In scope

- `publish_jobs` / `publish_attempts` schema in Convex
- Publish state machine: `QUEUED → PROCESSING → PUBLISHED | FAILED | DEAD_LETTER`
- Idempotent worker completion API
- Automatic retries with exponential backoff + SQS DLQ
- Error taxonomy (transient vs permanent)
- Derived post publish status (no corruption on partial failure)
- Worker changes: stop calling `updatePostPublishStatus` directly
- Webhook routing spec (Phase 4 — document now, implement after pipeline)
- Postiz feature-parity comparison (patterns only, not stack)
- Remove FREE plan from new specs (grandfather existing users)

### Out of scope

- PlanetScale migration / dual-write
- Auth provider change (Clerk stays)
- In-app AI chat, LangGraph, AI caption/image/video generation
- New social platforms
- NestJS/Fastify new backend service
- Replacing Convex real-time subscriptions

---

## File map

| Page | Path | Purpose |
|------|------|---------|
| Hub | `files/index.html` | Navigation |
| 01 | `files/01-overview.html` | Executive summary |
| 02 | `files/02-problem-statement.html` | Why publishing is fragile |
| 03 | `files/03-current-architecture.html` | Today’s system diagram |
| 04 | `files/04-current-paths.html` | Code paths & coupling |
| 05 | `files/05-target-architecture.html` | Target system diagram |
| 06 | `files/06-decisions-adrs.html` | Architecture decision records |
| 07 | `files/07-schema.html` | Tables, indexes, DDL |
| 08 | `files/08-publish-pipeline.html` | State machine, retries, errors |
| 09 | `files/09-api-routes.html` | REST + internal routes |
| 10 | `files/10-webhooks.html` | Webhook routing plan |
| 11 | `files/11-migration.html` | Phased zero-downtime rollout |
| 12 | `files/12-postiz-comparison.html` | Postiz parity analysis |
| 13 | `files/13-acceptance-criteria.html` | Testable criteria |
| 14 | `files/14-risks-effort.html` | Risks, effort, decision gates |

---

## Key decisions (ADR summary)

| ID | Decision |
|----|----------|
| ADR-001 | Convex remains system of record |
| ADR-002 | One `publish_job` per post × social provider per run |
| ADR-003 | Post `publishStatus` derived from jobs; never set by worker alone |
| ADR-004 | Worker writes via `apps/api` `/internal/publish/*` (HMAC auth) |
| ADR-005 | Webhooks move to CF Workers in Phase 4; Instagram stays on AWS Lambda |
| ADR-006 | Keep Convex subscriptions for real-time dashboard |
| ADR-007 | Partial publish shows `PARTIAL` + per-platform status chips |
| ADR-008 | Grandfather FREE users; block new FREE signups in new specs |
| ADR-009 | Convex schema SSOT — `schemas/publish.ts`, no duplicated enums |

---

## Implementation order

### Phase 0 — Instrument (3 days)

- [ ] Add PostHog events: `publish_job_created`, `publish_attempt_started`, `publish_attempt_failed`
- [ ] Document architecture in spec (this folder)

### Phase 1 — Additive schema (1 week)

- [ ] Add `publish_jobs`, `publish_attempts` Convex tables
- [ ] Add `publishStatus`, `lifecycleStatus` on `posts` (keep `status` alias)
- [ ] `createPublishRun` mutation — shadow mode (log only, no behavior change)

### Phase 2 — Dual path (1 week)

- [ ] SQS message includes `publishJobId`
- [ ] Worker calls `/internal/publish/complete`
- [ ] Compare shadow vs legacy `updatePostPublishStatus` in logs

### Phase 3 — Cutover (3 days)

- [ ] Remove worker → `updatePostPublishStatus`
- [ ] `publishScheduledPost` → `createPublishRun`
- [ ] Wire dashboard retry (`failed-posts-alert.tsx`, `post-card.tsx`)
- [ ] Derive `posts.status` from jobs for UI backward compat

### Phase 4 — Webhooks (1 week)

- [ ] Add `apps/api` `/webhooks/clerk`, `/webhooks/dodo`, `/webhooks/callmelater/*`
- [ ] Run old Convex HTTP + new Workers in parallel
- [ ] Cut over external webhook URLs

### Phase 5 — Cleanup (3 days)

- [ ] Stuck-job sweeper (PROCESSING > 15 min)
- [ ] Deprecate direct `platformPosts` mutation from worker
- [ ] Remove FREE from new signup flows

---

## Code touch list

| File | Change |
|------|--------|
| `packages/database/convex/schema.ts` | Add `publish_jobs`, `publish_attempts` |
| `packages/database/convex/publish.ts` | **New** — createRun, completeAttempt, deriveStatus |
| `packages/database/convex/posts.ts` | Replace publish paths; remove worker-facing mutation |
| `packages/database/convex/http.ts` | Deprecate after Phase 4 |
| `packages/worker/client.ts` | Call API instead of Convex mutation |
| `packages/infrastructure/src/trigger-sqs.ts` | Accept `publishJobId` in payload |
| `packages/infrastructure/sst.config.ts` | SQS DLQ, maxReceiveCount |
| `packages/api/services/post.service.ts` | Use `createPublishRun`; remove hardcoded Lambda URL |
| `apps/api/src/routes/internal/publish.ts` | **New** — worker completion endpoints |
| `apps/api/src/app.ts` | Mount internal + webhook routes |
| `apps/app/components/dashboard/failed-posts-alert.tsx` | Wire retry |
| `packages/worker/providers/errors.ts` | Use `isRetryableError` in worker |

---

## Review rubric (challenge these)

1. **Multi-provider race** — Does `derivePostPublishStatus` handle concurrent job completions atomically?
2. **Idempotency** — Can a duplicate SQS delivery or retry create two platform posts?
3. **Partial publish** — Is `PARTIAL` visible in calendar, posts list, and API responses?
4. **Permanent vs transient** — Does worker delete SQS message on permanent errors (no infinite retry)?
5. **Provider published, DB failed** — Is `platform_post_id` persisted on attempt before marking success?
6. **Approval gate** — Org posts with `reviewStatus !== APPROVED` must not create jobs.
7. **Automation link** — `linkPublishedPost` must fire from job completion, not old mutation path.
8. **Zero downtime** — Can Phase 1–3 ship without webhook URL changes?

---

## Open questions

| # | Question | Default |
|---|----------|---------|
| 1 | Partial publish UX | `PARTIAL` + per-platform chips |
| 2 | Webhook timing | Phase 4 after pipeline cutover |
| 3 | FREE plan | Grandfather existing |
| 4 | Call Me Later | Keep; change target URL in Phase 4 |

---

## Convex schema — single source of truth

When implementing Phase 1+, **do not repeat enums or field validators** across `publish.ts`, `posts.ts`, `apps/api`, or the worker.

| What | Where |
|------|-------|
| `publishJobStatus`, `publishAttemptStatus`, `errorClass`, `publishStatus`, `lifecycleStatus` | `packages/database/convex/schemas/publish.ts` |
| Re-export | `packages/database/convex/schemas/index.ts` |
| Table registration | `packages/database/convex/schema.ts` imports `basePublishJobSchema`, etc. |
| TS types for app/API | `Infer<typeof publishJobSchema>` or const objects (`PUBLISH_JOB_STATUS`) from schemas |
| Worker error codes | Import from `@delulu/worker/providers/errors` — map to `errorClass` in completion payload, don't redefine codes in Convex |

**Anti-patterns:** inline `v.literal("QUEUED")` in mutations; duplicate string unions in `apps/api/src/types.ts`; copying DDL enums by hand in multiple HTML/spec/code locations without pointing at `schemas/publish.ts`.

## Constraints (non-negotiable)

- Clerk for human auth
- No in-app AI chat / LangGraph / AI generation
- Preserve Instagram DM automations + post approval workflow
- Minimum paid tier = ECHO (no FREE in new specs)

---

## Moats to preserve

1. **Instagram DM automations** — `instagram-webhook` Lambda + CF KV cache + Convex automation tables unchanged in v1
2. **Post approval workflow** — `postReviews` / `reviewActivity`; jobs only created when `reviewStatus === APPROVED` for org posts