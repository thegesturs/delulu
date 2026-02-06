# Instagram DM Automation (ManyChat Competitor)

**Branch:** `wiz/automate-dms-instagram`
**Status:** In Progress
**Last Updated:** 2026-02-06

## Overview

Build a production-grade Instagram DM automation system that automatically sends private replies when users comment on Instagram posts.

## Architecture

```
Instagram Comment → Cloudflare Worker
  1. Validate X-Hub-Signature-256
  2. Return 200 immediately
  3. ctx.waitUntil() → background processing:
     a. Query Convex: get automations for this mediaId + access token + usage
     b. Evaluate conditions in-memory
     c. No match? → done (1 Convex call total)
     d. Match + under plan limit? → send DM via Instagram API
     e. Mutate Convex: increment usage.dmsSent + automation stats + minimal log
  Done. (2 Convex calls per DM sent, 1 per non-match)
```

---

## Completed Work

### 1. Database Schemas (Convex) ✅

**Files:**
- `packages/database/convex/schemas/automations.ts`
- `packages/database/convex/schemas/users.ts` (added `dmsSent` to usage)

**Tables:**
- `automations` - Automation rules (trigger type, conditions, message template, target posts)
- `automationLogs` - Minimal execution history (DM_SENT only)

**Indexes:**
- automations: by_user_id, by_social_provider_id, by_is_active, by_trigger_type, by_social_provider_active
- automationLogs: by_automation_id, by_user_id

**DM Plan Limits (in `DM_PLAN_LIMITS`):**
- FREE → 100 DMs/month
- VIBE → 5,000 DMs/month
- ECHO → 50,000 DMs/month

---

### 2. Cloudflare Worker ✅

**Package:** `packages/instagram-webhook/`

**Files:**
- `package.json` - CF Worker tooling + Convex
- `wrangler.toml` - Worker config
- `tsconfig.json`
- `src/index.ts` - The entire worker

**Secrets Required (set via `wrangler secret put`):**
```bash
INSTAGRAM_APP_SECRET         # From Meta App Dashboard → Settings → Basic
INSTAGRAM_WEBHOOK_VERIFY_TOKEN  # Random string you create
CONVEX_URL                   # Your Convex deployment URL
CONVEX_DEPLOY_KEY            # Convex deploy key (for internal functions)
```

---

### 3. Convex Functions ✅

**Files:**
- `packages/database/convex/automations.ts`
  - `getAutomations` - List user's automations
  - `getAutomation` - Get single automation
  - `getForWebhook` - (internal) Single query: automations + token + usage for CF Worker
  - `recordDMSent` - (internal) Single mutation: increment usage + stats + log
  - `createAutomation` - Create new automation
  - `updateAutomation` - Update automation
  - `deleteAutomation` - Delete automation
  - `toggleAutomation` - Enable/disable

- `packages/database/convex/automationLogs.ts`
  - `getLogsByAutomation` - Query logs for display

- `packages/database/convex/social_providers.ts`
  - `getByProfileId` - Find provider by Instagram profile ID

---

### 4. Instagram OAuth Scopes ✅

**File:**
- `packages/api/services/connect-url.service.ts`

**Scopes:**
- `instagram_business_manage_messages` (for sending DMs)
- `instagram_business_manage_comments` (for reading comments)

---

### 5. UI Components ✅

**Pages:**
- `apps/app/app/(authenticated)/automations/page.tsx` - Main list page
- `apps/app/app/(authenticated)/automations/[id]/page.tsx` - Edit automation
- `apps/app/app/(authenticated)/automations/[id]/analytics/page.tsx` - View stats & logs

**Components:**
- `apps/app/components/automations/automations-client.tsx` - Main client component
- `apps/app/components/automations/automations-header.tsx` - Page header with create button
- `apps/app/components/automations/automation-stats.tsx` - Stats cards
- `apps/app/components/automations/automation-filters.tsx` - Search, status, trigger filters
- `apps/app/components/automations/automation-list.tsx` - Grid/list view
- `apps/app/components/automations/automation-card.tsx` - Individual automation card
- `apps/app/components/automations/create-automation-dialog.tsx` - Create dialog with tabs
- `apps/app/components/automations/post-selector.tsx` - Instagram post selection

---

## Removed (Simplified Away)

- **AWS Lambda infrastructure** (receiver + processor + SQS + DLQ)
- **webhookEvents table** - No longer stored
- **Per-automation rate limits** (maxDMsPerHour, maxDMsPerDay, cooldownMinutes) — replaced by plan-level limits
- **Verbose logging** (TRIGGERED, DM_FAILED, RATE_LIMITED, CONDITION_NOT_MET, DUPLICATE) — now only DM_SENT
- **Convex HTTP /instagram-webhook** endpoint — replaced by CF Worker

---

## Pending Work

### 1. Testing & Deployment
- [ ] `pnpm install` — new package picked up by workspace
- [ ] `npx convex dev` — schema deploys (new dmsSent field, removed webhookEvents)
- [ ] `cd packages/instagram-webhook && pnpm dev` — Worker runs locally
- [ ] Set wrangler secrets for CF Worker
- [ ] `pnpm deploy` from worker package → deploy to CF
- [ ] Update Meta webhook URL → CF Worker URL
- [ ] Test verification: `curl <worker-url>?hub.mode=subscribe&hub.verify_token=...&hub.challenge=test`
- [ ] Test end-to-end: Comment on IG post → DM received → user.usage.dmsSent incremented

### 2. Data Migration
- [ ] Add `dmsSent: 0` to all existing users' usage objects
- [ ] Add `targetPostIds: []` to any existing automations with missing field

### 3. Token Refresh
- [ ] Implement Instagram token refresh logic (60-day expiry)

### 4. Additional Triggers (Future)
- [ ] Mention trigger
- [ ] Story reply trigger

---

## Environment Variables

### CF Worker Secrets
```bash
wrangler secret put INSTAGRAM_APP_SECRET
wrangler secret put INSTAGRAM_WEBHOOK_VERIFY_TOKEN
wrangler secret put CONVEX_URL
wrangler secret put CONVEX_DEPLOY_KEY
```

### Meta App Dashboard
- Callback URL: CF Worker URL from `wrangler deploy` output
- Verify Token: Same as INSTAGRAM_WEBHOOK_VERIFY_TOKEN
- Subscribe to: `comments` field

---

## Key Files Reference

| Purpose | Path |
|---------|------|
| Automation schemas | `packages/database/convex/schemas/automations.ts` |
| User schema (dmsSent) | `packages/database/convex/schemas/users.ts` |
| Main schema | `packages/database/convex/schema.ts` |
| Convex automations | `packages/database/convex/automations.ts` |
| Convex logs | `packages/database/convex/automationLogs.ts` |
| CF Worker | `packages/instagram-webhook/src/index.ts` |
| Worker config | `packages/instagram-webhook/wrangler.toml` |
| OAuth scopes | `packages/api/services/connect-url.service.ts` |
| UI pages | `apps/app/app/(authenticated)/automations/` |
| UI components | `apps/app/components/automations/` |

---

## Rate Limits

**Plan-level limits (tracked in user.usage.dmsSent):**
- FREE: 100 DMs/month
- VIBE: 5,000 DMs/month
- ECHO: 50,000 DMs/month
- Instagram allows only 1 private reply per comment
- Private replies must be within 7 days of comment
