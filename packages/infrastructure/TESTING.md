# Testing the Instagram Webhook Automation Flow

Two ways to exercise the webhook → KV → Convex → DM pipeline. Use the **simulator** for everyday dev and regression testing. Use **real Instagram** before shipping something that changes the Meta-facing surface.

## 1. Simulated payload (fast path, no real IG needed)

Signs a fake webhook with the same `INSTAGRAM_APP_SECRET` your Lambda uses and POSTs it to the Lambda URL. The Lambda can't tell the difference from a real IG event — signature validation, KV lookup, Convex query, DM send all run as they would in production.

### What it exercises

| Stage | What runs | How to verify |
|---|---|---|
| Signature validation | `validateSignature` in Lambda | 401 response = bad secret |
| Payload extraction | `extractCommentEvents` / `extractMessageEvents` | Lambda logs `[webhook] Processing N events` |
| KV gate | `kvGetTrigger` / `kvGetSession` | Lambda logs `[skip] KV miss` OR proceeds |
| Convex query | `getForWebhook` / `findActiveSessionByUser` | Convex dashboard → Functions logs |
| Automation logic | `executeStepFlow` in Lambda | Lambda logs `[match] N automations` |
| DM send | Instagram Graph API | DM hits the `--sender-id`'s inbox for real |
| Stats | `recordDMSent` mutation | New row in `automationLogs` table |

### Setup

```bash
# Install deps (first time only)
pnpm install

# Set these once in your shell
export IG_WEBHOOK_URL=https://xxx.lambda-url.us-east-1.on.aws/   # from `sst deploy` output
export INSTAGRAM_APP_SECRET=...                                  # Meta app dashboard → Basic → App Secret
```

### Fire a comment (most common)

Simulates a user commenting on one of your posts. If an automation targets that `mediaId`, it fires and the sender gets a real DM.

```bash
cd packages/infrastructure
pnpm simulate:comment -- \
  --profile-id 17841400000000000 \
  --media-id 17890000000000000 \
  --text "interested" \
  --sender-id 100000000000000 \
  --username test_user
```

`--profile-id` = your Instagram business account id. `--media-id` = a real Instagram post id that has an active automation (from the `automations.triggers[].targetPostIds` array in Convex). `--sender-id` must be a real IG user id that has messaged your account before — Meta rejects DMs to strangers.

### Fire a plain text message (email collection flow)

Simulates a user replying to an in-flight session. The Lambda checks the KV session cache → Convex → advances the flow.

```bash
pnpm simulate:message -- \
  --profile-id 17841400000000000 \
  --sender-id 100000000000000 \
  --text "hello@example.com"
```

Only does anything if the `sender-id` has an active session (one was created by a prior comment trigger that had a condition step).

### Fire a quick-reply button tap

Simulates the user tapping a button on a DM. Payload encoding matches the prefix the Lambda expects.

```bash
pnpm simulate:quick-reply -- \
  --profile-id 17841400000000000 \
  --sender-id 100000000000000 \
  --payload "k174automation_id:step_id:btn_payload"
```

### Flags reference

| Flag | Comment | Message | Quick-reply | Default |
|---|---|---|---|---|
| `--url` | ✓ | ✓ | ✓ | `IG_WEBHOOK_URL` env |
| `--secret` | ✓ | ✓ | ✓ | `INSTAGRAM_APP_SECRET` env |
| `--profile-id` | **required** | **required** | **required** | — |
| `--media-id` | **required** | — | — | — |
| `--sender-id` | **required** | **required** | **required** | — |
| `--text` | ✓ | ✓ | — | sensible default |
| `--username` | ✓ | — | — | `simulator` |
| `--payload` | — | — | **required** | — |
| `--comment-id` / `--message-id` | ✓ | ✓ | ✓ | auto-generated |

### What success looks like

```
→ POST https://xxx.lambda-url...
  mode    : comment
  payload : { ... }
  sig     : sha256=...
← 200 {"received":true}

Next: check your Convex logs for [process] / [skip] / [match] lines.
```

Then:
1. **Convex dashboard** → Functions → look for `getForWebhook` call (fast path) or `[skip] KV miss` (miss path).
2. **Instagram inbox** → if the automation matched, the DM arrives within a few seconds.
3. **Convex `automationLogs` table** → new row with `status: "DM_SENT"`.

### Troubleshooting

| Symptom | Cause |
|---|---|
| `401 Invalid signature` | Wrong `INSTAGRAM_APP_SECRET`. Copy it fresh from Meta → App Dashboard → App Settings → Basic |
| `200 {"received":true}` but no DM | Either no automation targets this `mediaId` (check KV: `wrangler kv key get --namespace-id 0fa4faf775ec4ab28e259c8a5503dc3c 'trig:{profileId}:{mediaId}'`) or the condition step filtered out the message text |
| DM API errors in Lambda logs | Real Instagram access token is invalid/expired, OR the `sender-id` has never messaged your account (24h window) |
| Lambda logs `[getForWebhook] fallback path` | KV is unavailable from Lambda — check `CF_KV_API_TOKEN` is set on the Lambda |

## 2. Real Instagram events (ground truth)

Use this sparingly — it needs a real phone / test Instagram account.

1. Create an automation in the app targeting a specific post.
2. Open Instagram (app or web), comment on that post with text that matches the automation's trigger.
3. Watch the Lambda logs (`sst logs --stage production InstagramWebhook`) — you should see `[webhook] Processing 1 comment events` within seconds.
4. Check Convex dashboard for a `getForWebhook` call.
5. Wait for the DM in the commenter's inbox.

## 3. Unit tests for the diff logic

Pure-function tests for `triggerDiff` and `sessionOp` — no infra, runs in <1s.

```bash
cd packages/database
pnpm test
```

19 tests cover create / update / delete / toggle / linkPublishedPost scenarios and every session state transition. Run this after any change to `packages/database/convex/lib/trigger_kv_sync.ts`.

## Inspecting KV state manually

The trigger cache lives in the `DELULU_RATE_LIMIT_KV` namespace (id `0fa4faf775ec4ab28e259c8a5503dc3c`).

```bash
# One key
wrangler kv key get --namespace-id 0fa4faf775ec4ab28e259c8a5503dc3c 'trig:17841400000000000:17890000000000000'

# Every trigger key (first 100)
wrangler kv key list --namespace-id 0fa4faf775ec4ab28e259c8a5503dc3c --prefix 'trig:' | jq -r '.[].name'

# Every session key
wrangler kv key list --namespace-id 0fa4faf775ec4ab28e259c8a5503dc3c --prefix 'sess:'
```

## Re-seeding KV

If KV and Convex ever drift (cosmic ray, mid-mutation crash, manual tinkering), the backfills are idempotent and safe to re-run:

```bash
cd packages/database
npx convex run automations:backfillTriggerKv --prod
npx convex run automations:backfillSessionKv --prod
```

Both walk Convex and overwrite every relevant KV key with the current state.
