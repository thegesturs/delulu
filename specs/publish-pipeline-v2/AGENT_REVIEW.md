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
| 03 | `files/03-current-architecture.html` | Today's system diagram |
| 04 | `files/04-current-paths.html` | Code paths & coupling |
| 05 | `files/05-target-architecture.html` | Target system diagram |
| 06 | `files/06-decisions-adrs.html` | Architecture decision records |
| 07 | `files/07-schema.html` | Tables, indexes, DDL |
| 08 | `files/08-publish-pipeline.html` | State machine, retries, errors |
| 09 | `files/09-api-routes.html` | REST + internal routes |
| 10 | `files/10-webhooks.html` | Webhook routing plan |
| 11 | `files/11-migration.html` | Phased zero-downtime rollout |
| 12 | `files/12-acceptance-criteria.html` | Testable criteria |
| 13 | `files/13-risks-effort.html` | Risks, effort, decision gates |

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

- [ ] Add `packages/database/convex/schemas/publish.ts` (SSOT)
- [ ] Add `publish_jobs`, `publish_attempts` Convex tables
- [ ] Add `publishStatus`, `lifecycleStatus` on `posts`
- [ ] `createPublishRun` mutation — shadow mode

### Phase 2 — Dual path (1 week)

- [ ] SQS message includes `publishJobId`
- [ ] Worker calls `/internal/publish/complete`
- [ ] SQS DLQ + `maxReceiveCount: 5`

### Phase 3 — Cutover (3 days)

- [ ] Remove worker → `updatePostPublishStatus`
- [ ] Wire dashboard retry
- [ ] Derive `posts.status` from jobs

### Phase 4 — Webhooks (1 week)

- [ ] Add `apps/api` `/webhooks/*`
- [ ] Dual endpoints during cutover

### Phase 5 — Cleanup (3 days)

- [ ] Stuck-job sweeper
- [ ] FREE plan signup block for new users

---

## Convex schema — single source of truth

| What | Where |
|------|-------|
| Publish enums + base schemas | `packages/database/convex/schemas/publish.ts` |
| Barrel export | `packages/database/convex/schemas/index.ts` |
| Table registration | `packages/database/convex/schema.ts` |
| Worker error codes | `packages/worker/providers/errors.ts` — map to `errorClass`, don't redefine in Convex |

---

## Code touch list

| File | Change |
|------|--------|
| `packages/database/convex/schema.ts` | Add `publish_jobs`, `publish_attempts` |
| `packages/database/convex/schemas/publish.ts` | **New** — SSOT for publish types |
| `packages/database/convex/publish.ts` | **New** — createRun, completeAttempt |
| `packages/database/convex/posts.ts` | Replace publish paths |
| `packages/worker/client.ts` | Call API instead of Convex mutation |
| `apps/api/src/routes/internal/publish.ts` | **New** |
| `packages/api/services/post.service.ts` | Use `createPublishRun` |

---

## Constraints

- Clerk for human auth
- No in-app AI chat / LangGraph / AI generation
- Preserve Instagram DM automations + post approval workflow
- Minimum paid tier = ECHO (no FREE in new specs)