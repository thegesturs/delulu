---
name: No Convex Scheduler for Production
description: Never suggest Convex ctx.scheduler.runAfter() for delayed/scheduled tasks — 100 concurrent limit
type: feedback
---

Never suggest Convex `ctx.scheduler.runAfter()` for scheduling delayed tasks.

**Why:** Convex scheduler has a hard limit of 100 concurrent scheduled functions, which is far too low for production use cases like delayed DM follow-ups where many users could have pending delays simultaneously.

**How to apply:** When implementing any delayed/scheduled execution (e.g., timed follow-ups, retry logic, deferred jobs), use the project's existing CallMeLater API (`https://api.callmelater.xyz`) instead. See `packages/database/convex/callmelater.ts` for existing patterns — schedule via `POST /schedule`, cancel via `POST /schedule/cancel`, store the returned `scheduleId` for cancellation.
