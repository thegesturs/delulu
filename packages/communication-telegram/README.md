# Telegram text pilot

The API Worker receives authenticated Telegram updates at
`/v1/providers/telegram/webhook`. It uses the shared durable conversation/outbox
engine and the agent runtime service binding. Message payloads do not enter
Postgres. Each private chat has an isolated guest runtime identity; it is not a
verified Delulu account or linked to a personal workspace.

The public pilot accepts private text messages only and reserves at most ten
unique updates across the entire bot. Failed turns retain their reservation.
This is a test allowance, not dollar-based production billing. Duplicate update
IDs must match their original sender. Group messages and edited messages are ignored.

## Staging setup

From the repository root:

```sh
pnpm --filter @delulu/http-api exec wrangler secret put TELEGRAM_BOT_TOKEN --env staging
pnpm --filter @delulu/http-api run deploy:staging
node scripts/setup-telegram.mjs https://delulu-staging.whizzy.workers.dev staging
```

The script preserves an existing `TELEGRAM_WEBHOOK_SECRET`, creates it on first
setup, and registers the deployed URL using the bot token inside the Worker.
It removes its temporary `TELEGRAM_SETUP_TOKEN` after registration. If cleanup
fails, remove that secret using Wrangler before leaving setup unattended. The
setup endpoint rejects requests without this separate credential.

Send a fresh message to the returned bot username and inspect Worker logs for
`channel_delivery`. Webhook registration alone does not prove agent inference
or successful reply delivery. Provider timeouts have ambiguous delivery status
and are not automatically resent. Explicit rate limits get bounded retries.

Set `TELEGRAM_INGRESS_ENABLED=false` and deploy the same environment to stop
processing. Production is not enabled by staging setup. Voice notes, account
linking, Content HQ writes, and production budgets remain outside this pilot.
