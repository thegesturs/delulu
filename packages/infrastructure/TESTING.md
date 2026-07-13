# Infrastructure verification

The AWS stack contains the primary publishing SQS lane and the transcription
function. Meta, Clerk, and billing webhooks are handled by the Cloudflare API
worker.

## Publishing lane

1. Deploy an isolated stage:

   ```bash
   pnpm --filter @delulu/infra deploy --stage dev
   ```

2. Set the API worker's `SQS_INGRESS_URL` to the
   `PostgresSocialPostsApiEndpoint` output and set `SQS_INGRESS_SECRET` to the
   same value as the SST `LAMBDA_SECRET_KEY` secret.
3. Create or schedule a post against a test workspace.
4. Confirm the durable job moves through `pending` → `dispatched` → `completed`
   and the target becomes `published`.
5. Confirm the primary queue returns to zero visible messages and the dead-letter
   queue remains empty.

Failures intentionally classified as retryable reappear after the queue's
visibility timeout. After five receives they move to the dead-letter queue.

## Transcription function

Call the `TranscriptionApiEndpoint` output with a valid Clerk session token and
verify that create, lookup, and usage updates are reflected in Postgres.

## Production gate

Before deploying production, run:

```bash
pnpm --filter @delulu/infra typecheck
pnpm --filter @delulu/connections typecheck
pnpm --filter @delulu/worker typecheck
pnpm --filter @delulu/worker test:integration
```
