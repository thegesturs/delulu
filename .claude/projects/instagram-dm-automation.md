# Instagram DM Automation (ManyChat Competitor)

**Branch:** `wiz/automate-dms-instagram`
**Status:** In Progress — Flow Builder v2 complete, E2E working
**Last Updated:** 2026-02-07

## Overview

Build a production-grade Instagram DM automation system that automatically sends private replies when users comment on Instagram posts. Includes a visual flow builder, DM buttons, comment replies, and multi-trigger support.

## Architecture

```
Instagram Comment → Lambda (Function URL)
  1. Validate X-Hub-Signature-256
  2. Query Convex: get automations for this mediaId + access token + usage
  3. Traverse step-based flow tree (conditions → send DM)
  4. No match? → done (1 Convex call total)
  5. Match + under plan limit? → send DM via Instagram API (with optional buttons)
  6. Optionally reply to comment publicly (random pick from list)
  7. Mutate Convex: increment usage.dmsSent + automation stats + minimal log
  Done. (2 Convex calls per DM sent, 1 per non-match)
```

---

## Storage Model (v2 — Step-Based)

Replaced old flat fields (`triggerType`, `conditions`, `messageTemplate`) and React Flow fields (`flowNodes`, `flowEdges`) with a **step-based tree**:

```ts
// Automation document shape:
{
  triggers: TriggerStep[],   // Multiple triggers, OR logic
  steps: AutomationStep[],   // Flat array with ID references (condition | send_dm)
  // ... meta fields
}
```

### Step Types

- **TriggerStep**: `{ id, type: 'trigger', triggerType, targetPostIds, nextStepId? }`
- **ConditionStep**: `{ id, type: 'condition', operator, value?, caseSensitive?, yesStepId?, noStepId? }`
- **SendDmStep**: `{ id, type: 'send_dm', messageTemplate, buttons?, commentReply?, nextStepId? }`

### Key Design Decisions
- **No x,y positions stored** — React Flow positions computed at render time via `stepsToFlow()` auto-layout
- **No legacy support** — this branch is greenfield, no migration code
- **No flowVersion field** — single format only
- **Active by default** — new automations created with `isActive: true`

---

## Features

### Multiple Triggers (OR Logic)
- Each automation can have multiple triggers
- Any matching trigger fires the flow
- All triggers share the same step chain

### DM Buttons
- **Quick Replies**: up to 13, tappable buttons below message
- **URL Buttons**: up to 3, link buttons using template attachment
- Cannot mix both types in one message (Instagram limitation)
- URL validation on frontend (must be valid https:// URL)

### Comment Replies
- After sending DM, optionally reply to comment publicly
- Configure list of reply options (e.g. "Check your DMs! 📩")
- One picked randomly at send time
- Uses Instagram `/replies` endpoint

### Condition Operators
`contains`, `not_contains`, `equals`, `starts_with`, `ends_with`, `regex`, `always`

---

## Flow Builder UI

### Component Structure

```
apps/app/components/automations/flow-builder/
  flow-builder.tsx              # Main component — state, save, React Flow provider
  flow-canvas.tsx               # React Flow canvas (display-only, no drag/connect)
  flow-toolbar.tsx              # Top bar: back, name input, active toggle, save
  flow-sidebar-panel.tsx        # Sheet panel — routes to trigger/condition/send-dm panels

  nodes/
    trigger-node.tsx            # React Flow custom node
    condition-node.tsx
    send-dm-node.tsx

  panels/
    trigger-panel.tsx           # Account picker + trigger type + post selector
    condition-panel.tsx         # Operator, value, case sensitive
    send-dm-panel.tsx           # Message + variables + IG DM preview + buttons + comment reply
    button-editor.tsx           # Quick reply / URL button tabs
    comment-reply-editor.tsx    # Toggle + reply text list

  trigger-wizard/
    trigger-wizard.tsx          # 3-step dialog for adding triggers
    account-step.tsx            # Step 1: Pick Instagram account
    trigger-type-step.tsx       # Step 2: Pick trigger type (rich cards)
    post-selector-step.tsx      # Step 3: Pick target posts

  hooks/
    use-automation-state.ts     # State management: triggers[], steps[], meta, dirty tracking

  utils/
    flow-types.ts               # Re-exports from schema + AutomationMeta interface
    flow-validation.ts          # Validation (triggers, steps, URLs, reachability)
    auto-layout.ts              # stepsToFlow() — converts steps → React Flow nodes/edges
    step-helpers.ts             # CRUD helpers: createId, createTrigger, insertStepAfter, etc.
```

### UX Details
- **3 action cards at bottom**: Add Trigger, Add Condition, Add Send DM (disabled until trigger exists)
- **Trigger wizard**: ManyChat-style 3-step dialog (account → type → posts)
- **Sidebar panels**: Sheet with proper padding (p-0 on SheetContent, px-6 py-4 header, px-6 py-5 content)
- **Trigger panel**: Account picker + trigger type cards (COMMENT active, MENTION/STORY_REPLY coming soon) + post selector
- **Send DM preview**: Dark Instagram DM mockup with chat bubbles, quick reply pills, URL buttons
- **Flow canvas**: React Flow with `nodesDraggable={false}`, `nodesConnectable={false}` — display only

---

## Completed Work

### 1. Database Schema

**File:** `packages/database/convex/schemas/automations.ts`

Schemas: `triggerStepSchema`, `conditionStepSchema`, `sendDmStepSchema`, `automationStepSchema`, `commentReplySchema`, `dmQuickReplySchema`, `dmUrlButtonSchema`, `dmButtonSchema`, `automationTriggerTypeSchema`, `automationConditionOperatorSchema`

### 2. Convex Functions

**File:** `packages/database/convex/automations.ts`

- `getAutomations` — list user's automations
- `getAutomation` — get single by ID
- `getForWebhook` — single query for Lambda (automations + token + usage), auth via `POSTING_SECRET_KEY`
- `recordDMSent` — increment usage + stats + log, auth via `POSTING_SECRET_KEY`
- `createAutomation` — defaults `isActive: true`
- `updateAutomation`, `deleteAutomation`, `toggleAutomation`

### 3. Lambda Webhook Handler

**File:** `packages/infrastructure/src/instagram-webhook.ts`

- `extractCommentEvents` — parse webhook payload
- `evaluateCondition` — condition matching
- `executeStepFlow` — traverse step tree from trigger → condition → send_dm
- `sendPrivateReply` — Instagram DM API with button support
- `replyToComment` — public comment reply via `/replies` endpoint
- `processComment` — orchestrates the full flow
- `handler` — Lambda entry point (GET verification + POST processing)

### 4. Flow Builder UI (all new files listed above)

### 5. Updated Existing Components

- `automations-client.tsx` — filter uses `automation.triggers.some()` instead of old `automation.triggerType`
- `automation-card.tsx` — uses helper functions for trigger type/step summary instead of old flat fields
- `schema.ts` — removed `by_trigger_type` index

---

## Environment Variables

### SST Secrets
```bash
pnpm sst secret set LAMBDA_SECRET_KEY "..."
pnpm sst secret set INSTAGRAM_APP_SECRET "..."
pnpm sst secret set INSTAGRAM_WEBHOOK_VERIFY_TOKEN "..."
pnpm sst secret set CONVEX_URL "..."
```

### Convex Environment Variables
- `POSTING_SECRET_KEY` — shared secret for Lambda ↔ Convex auth (set in Convex dashboard)

### Meta App Dashboard
- Callback URL: Lambda Function URL from `pnpm sst deploy` output
- Verify Token: Same as `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`
- Subscribe to: `comments` field

---

## Key Files Reference

| Purpose | Path |
|---------|------|
| Automation schemas | `packages/database/convex/schemas/automations.ts` |
| User schema (dmsSent) | `packages/database/convex/schemas/users.ts` |
| Main schema | `packages/database/convex/schema.ts` |
| Convex functions | `packages/database/convex/automations.ts` |
| Convex logs | `packages/database/convex/automationLogs.ts` |
| Lambda webhook | `packages/infrastructure/src/instagram-webhook.ts` |
| SST config | `packages/infrastructure/sst.config.ts` |
| OAuth scopes | `packages/api/services/connect-url.service.ts` |
| Flow builder | `apps/app/components/automations/flow-builder/` |
| UI pages | `apps/app/app/(authenticated)/automations/` |
| UI components | `apps/app/components/automations/` |
| Types | `apps/app/types/convex.ts` |

---

## Rate Limits

**Plan-level limits (tracked in user.usage.dmsSent):**
- FREE: 100 DMs/month
- VIBE: 5,000 DMs/month
- ECHO: 50,000 DMs/month
- Instagram allows only 1 private reply per comment
- Private replies must be within 7 days of comment

---

## Known Issues / Bugs Fixed

1. **`insertStepAfter` didn't handle `'next'` branch for conditions** — new steps were orphaned (not linked to flow). Fixed: `'next'` maps to `'yes'` for condition steps.
2. **Secret mismatch** — `getForWebhook` and `recordDMSent` used `LAMBDA_SECRET_KEY` env var but Convex had `POSTING_SECRET_KEY`. Both now use `POSTING_SECRET_KEY`.
3. **Invalid URL buttons crash DM send** — Instagram API rejects invalid URLs. Added `isValidUrl()` validation in `flow-validation.ts` + inline error on URL input in `button-editor.tsx`.

---

## Pending Work

- [ ] Token refresh logic (Instagram 60-day expiry)
- [ ] MENTION trigger support
- [ ] STORY_REPLY trigger support
- [ ] Analytics page integration with new step-based data
- [ ] Monthly usage reset for dmsSent
- [ ] Delete unused `add-step-menu.tsx` file
