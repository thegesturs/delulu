# Instagram DM Automation (ManyChat Competitor)

**Branch:** `wiz/automate-dms-instagram`
**Status:** In Progress
**Last Updated:** 2026-02-06

## Overview

Build a production-grade Instagram DM automation system that automatically sends private replies when users comment on Instagram posts.

## Architecture

```
Instagram Comment → Meta Webhooks
                         ↓
              AWS Lambda (Webhook Receiver)
              - Validates X-Hub-Signature-256
              - Returns 200 immediately
                         ↓
              AWS SQS Queue (InstagramWebhooksQueue)
              - Message deduplication
              - Dead letter queue for failures
                         ↓
              AWS Lambda (Webhook Processor)
              - Fetches automation rules from Convex
              - Evaluates conditions
              - Sends private reply via Instagram API
              - Logs results to Convex
```

---

## Completed Work

### 1. Database Schemas (Convex) ✅

**Files Created:**
- `packages/database/convex/schemas/automations.ts`

**Tables Added:**
- `automations` - Automation rules (trigger type, conditions, message template, rate limits)
- `automationLogs` - Execution history for each automation run
- `webhookEvents` - Raw webhook storage for debugging

**Indexes:**
- by_user_id, by_social_provider_id, by_is_active, by_trigger_type
- by_automation_id, by_instagram_comment_id, by_status
- by_event_id, by_platform, by_received_at

---

### 2. SST Infrastructure ✅

**File Modified:**
- `packages/infrastructure/sst.config.ts`

**Resources Added:**
- `InstagramWebhooksDLQ` - Dead letter queue (14 days retention)
- `InstagramWebhooksQueue` - Main SQS queue with DLQ retry (3 attempts)
- `InstagramWebhookReceiver` - Lambda function with HTTP URL for Meta webhooks
- SQS subscriber Lambda for processing events

**Secrets Required:**
```bash
pnpm sst secret set INSTAGRAM_WEBHOOK_VERIFY_TOKEN "your-token"
pnpm sst secret set INSTAGRAM_APP_SECRET "from-meta-dashboard"
pnpm sst secret set CONVEX_URL "https://your-convex.convex.cloud"
```

---

### 3. Lambda Handlers ✅

**Files Created:**
- `packages/infrastructure/src/instagram-webhook-receiver.ts`
  - Handles GET (verification challenge)
  - Handles POST (webhook events)
  - Validates X-Hub-Signature-256
  - Queues events to SQS

- `packages/infrastructure/src/instagram-webhook-processor.ts`
  - Consumes SQS messages
  - Queries Convex for automations
  - Evaluates conditions (contains, equals, regex, always, etc.)
  - Renders message templates with variables
  - Sends private replies via Instagram API
  - Logs results to Convex

---

### 4. Instagram OAuth Scopes ✅

**File Modified:**
- `packages/api/services/connect-url.service.ts`

**Scopes Added:**
- `instagram_business_manage_messages` (for sending DMs)
- `instagram_business_manage_comments` (for reading comments)

---

### 5. Convex HTTP Endpoint (Backup) ✅

**File Modified:**
- `packages/database/convex/http.ts`

**Routes Added:**
- `GET /instagram-webhook` - Verification challenge
- `POST /instagram-webhook` - Event receiver (stores raw events)

Uses Web Crypto API for signature validation (Convex runtime compatible).

---

### 6. Convex Functions ✅

**Files Created:**
- `packages/database/convex/automations.ts`
  - `getAutomations` - List user's automations
  - `getAutomation` - Get single automation
  - `getActiveByProvider` - Get active automations for a provider
  - `getRateLimitCounts` - Check hourly/daily limits
  - `createAutomation` - Create new automation
  - `updateAutomation` - Update automation
  - `deleteAutomation` - Delete automation
  - `toggleAutomation` - Enable/disable
  - `incrementStats` - Update stats (internal)

- `packages/database/convex/automationLogs.ts`
  - `getLogsByAutomation` - Query logs
  - `getByCommentId` - Duplicate detection
  - `getAnalytics` - Stats and daily counts
  - `create` - Create log entry (internal)

- `packages/database/convex/webhookEvents.ts`
  - `getWebhookEvents` - List events
  - `getByEventId` - Get single event
  - `createWebhookEvent` - Store event (internal)
  - `updateByEventId` - Update status (internal)

**File Modified:**
- `packages/database/convex/social_providers.ts`
  - Added `getByProfileId` - Find provider by Instagram profile ID

---

### 7. UI Components ✅

**Files Created:**

**Pages:**
- `apps/app/app/(authenticated)/automations/page.tsx` - Main list page
- `apps/app/app/(authenticated)/automations/[id]/page.tsx` - Edit automation
- `apps/app/app/(authenticated)/automations/[id]/analytics/page.tsx` - View logs & stats

**Components:**
- `apps/app/components/automations/automations-client.tsx` - Main client component
- `apps/app/components/automations/automations-header.tsx` - Page header with create button
- `apps/app/components/automations/automation-stats.tsx` - Stats cards
- `apps/app/components/automations/automation-filters.tsx` - Search, status, trigger filters
- `apps/app/components/automations/automation-list.tsx` - Grid/list view
- `apps/app/components/automations/automation-card.tsx` - Individual automation card
- `apps/app/components/automations/create-automation-dialog.tsx` - Create dialog with tabs
- `apps/app/components/automations/index.ts` - Barrel export

**Navigation:**
- `apps/app/lib/navigation.ts` - Added "Automations" nav item
- `packages/design-system/icons/index.tsx` - Added Robot icon

---

## Pending Work

### 1. Testing & Deployment
- [ ] Deploy SST infrastructure
- [ ] Configure Meta App Dashboard with webhook URL
- [ ] Test webhook verification
- [ ] Test comment → DM flow end-to-end

### 2. Token Refresh
- [ ] Implement Instagram token refresh logic (60-day expiry)

### 3. UI Enhancements (Optional)
- [ ] Add post selector for targeting specific posts
- [ ] Add cooldown per user setting
- [ ] Bulk enable/disable automations

### 4. Additional Triggers (Future)
- [ ] Mention trigger
- [ ] Story reply trigger

---

## Environment Variables

### SST Secrets (AWS)
```bash
INSTAGRAM_WEBHOOK_VERIFY_TOKEN  # Random string you create
INSTAGRAM_APP_SECRET            # From Meta App Dashboard → Settings → Basic
CONVEX_URL                      # Your Convex deployment URL
```

### Convex Environment Variables
```
INSTAGRAM_WEBHOOK_VERIFY_TOKEN  # Same as SST (for backup endpoint)
INSTAGRAM_APP_SECRET            # Same as SST (for backup endpoint)
```

### Meta App Dashboard
- Callback URL: Lambda URL from `pnpm sst deploy` output
- Verify Token: Same as INSTAGRAM_WEBHOOK_VERIFY_TOKEN
- Subscribe to: `comments` field

---

## Key Files Reference

| Purpose | Path |
|---------|------|
| Automation schemas | `packages/database/convex/schemas/automations.ts` |
| Main schema | `packages/database/convex/schema.ts` |
| SST config | `packages/infrastructure/sst.config.ts` |
| Webhook receiver | `packages/infrastructure/src/instagram-webhook-receiver.ts` |
| Webhook processor | `packages/infrastructure/src/instagram-webhook-processor.ts` |
| Convex automations | `packages/database/convex/automations.ts` |
| Convex logs | `packages/database/convex/automationLogs.ts` |
| OAuth scopes | `packages/api/services/connect-url.service.ts` |
| UI pages | `apps/app/app/(authenticated)/automations/` |
| UI components | `apps/app/components/automations/` |

---

## Rate Limits

**Default limits (configurable per automation):**
- Max 20 DMs per hour
- Max 100 DMs per day
- Instagram allows only 1 private reply per comment
- Private replies must be within 7 days of comment
