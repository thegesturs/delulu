# Production backend cutover runbook

This is the operator checklist for the one-way production routing flip. The
repository change removes the retired runtime in one release; it does not make
external dashboard changes or delete the source deployment automatically.

## Abort rule

Until the app is reopened on Postgres, any failed migration check, missing
binding, failed smoke test, or unexplained queue activity means **stop and do
not route production traffic**. The frozen source deployment remains the
recovery dataset. After routing, fix forward on Postgres.

## 1. Prepare production credentials and resources

- Apply and verify every database migration:

  ```bash
  export DATABASE_URL='postgres://...:5432/...'
  pnpm pg:migrate
  pnpm pg:migrate:status
  ```

  Abort unless status reports the expected migration head with nothing pending.
- In Cloudflare **Storage & Databases → Hyperdrive**, verify the production id
  committed in `apps/api/wrangler.toml` points at the intended database. In
  **Storage & Databases → KV**, verify the committed `AUTOMATION_KV` and
  `EDGE_CACHE_KV` ids. Verify all four rate-limit bindings in the worker config.
- Set API worker secrets: `CLERK_JWT_KEY`, `AS_SIGNING_KEY`,
  `AS_SIGNING_KID`, `CONNECTION_STATE_SECRET`, `CLERK_SECRET_KEY`,
  `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
  `ENCRYPTION_SECRET`, `SQS_INGRESS_SECRET`, `META_APP_SECRET`,
  `META_VERIFY_TOKEN`, `CLERK_WEBHOOK_SECRET`, `DODO_WEBHOOK_SECRET`,
  `DODO_PAYMENTS_API_KEY`, and every social provider client id/secret listed in
  `apps/api/wrangler.toml`.
- Use the same value for the API worker's `SQS_INGRESS_SECRET` and SST
  `LAMBDA_SECRET_KEY`.
- Confirm `api.delulu.social` can be attached to the existing
  `delulu-api-next` Cloudflare worker. Do not route it yet.

Set each secret from the repository root; do not paste values into source or
shell history:

```bash
pnpm --filter @delulu/http-api exec wrangler secret put <SECRET_NAME>
```

## 2. Freeze and export

There are currently no active production users, so no maintenance-page code is
required. Disable the old webhook endpoints and schedulers, pause the old
publish ingress, and confirm the source deployment log shows no writes for at
least ten minutes. Optionally enable the identity provider's waitlist while the
window is open.

Use **AWS Console → Lambda → Functions** to disable the old webhook function
URL and old queue event-source mapping. Use the identity and payment provider
dashboards' **Webhooks → Endpoints** pages to disable their old endpoints.
Verify the legacy backend's production function log is quiet for ten minutes.

Take the canonical production export only after the write freeze is confirmed.
Keep the export immutable and record its SHA-256 checksum.

```bash
mkdir -p .context/cutover
CONVEX_DEPLOYMENT='prod:giant-canary-837' \
  npx convex export --path .context/cutover/production-export.zip
shasum -a 256 .context/cutover/production-export.zip \
  > .context/cutover/production-export.zip.sha256
```

## 3. Import and verify

Use direct Postgres port 5432, the production encryption secret, and the
canonical export:

```bash
export DATABASE_URL='postgres://...:5432/...'
export ENCRYPTION_SECRET='...'

pnpm --filter @delulu/migrate-convex exec tsx src/main.ts run \
  --snapshot /absolute/path/export.zip --confirm-database <production-host>
pnpm --filter @delulu/migrate-convex exec tsx src/main.ts verify \
  --snapshot /absolute/path/export.zip
pnpm --filter @delulu/migrate-convex exec tsx src/main.ts run \
  --snapshot /absolute/path/export.zip --confirm-database <production-host>
pnpm --filter @delulu/migrate-convex exec tsx src/main.ts verify \
  --snapshot /absolute/path/export.zip
pnpm --filter @delulu/migrate-convex exec tsx src/main.ts report \
  --snapshot /absolute/path/export.zip
```

Both verification runs must pass. Review and sign off the ownership, role
mapping, and edge-case reports. Every dropped row, pruned target, synthesized
value, and ownership conflict must be understood before routing production.

## 4. Deploy and route

1. Manually deploy the production SST stack and record the
   `PostgresSocialPostsApiEndpoint` output. Confirm the primary queue, DLQ,
   trigger function, publish worker, and transcription function are healthy.
   Also confirm the retired queue, trigger, worker, and webhook function were
   deleted; abort if any retired ingress remains live.

   ```bash
   gh workflow run deploy-infra.yml -f stage=production
   gh run watch --exit-status
   ```

2. Set the API worker's `SQS_INGRESS_URL` to that endpoint.

   ```bash
   pnpm --filter @delulu/http-api exec wrangler secret put SQS_INGRESS_URL
   ```

3. Deploy `apps/api`; attach `api.delulu.social` to the existing worker.

   ```bash
   pnpm --filter @delulu/http-api deploy
   ```

   In Cloudflare, open **Workers & Pages → delulu-api-next → Settings →
   Domains & Routes → Add → Custom domain**, then enter `api.delulu.social`.

4. Confirm `GET https://api.delulu.social/health` and `/openapi.json` succeed.

   ```bash
   curl --fail --show-error https://api.delulu.social/health
   curl --fail --show-error --output /dev/null \
     https://api.delulu.social/openapi.json
   ```

5. Deploy `apps/app` with its production environment.

   ```bash
   pnpm --filter app exec opennextjs-cloudflare build
   pnpm --filter app exec opennextjs-cloudflare deploy --env production
   ```

6. Update social-provider callback URLs to the corresponding
   `https://api.delulu.social/v1/connections/callback/<provider>` URL.
7. Point the Meta, Clerk, and payment-provider webhooks at the `/webhooks/meta`,
   `/webhooks/clerk`, and `/webhooks/dodo` endpoints. Complete each provider's
   challenge/test delivery.

Abort and remove the custom domain if any deploy, health check, provider
challenge, or callback update fails. Do not reopen the app in a partial state.

## 5. Smoke test before reopening

- Login, open the dashboard, and load the current workspace.
- Complete at least one connection OAuth flow.
- Create and schedule a post; observe jobs table → dispatcher → SQS → Lambda →
  completed target. Confirm the queue drains and the DLQ stays empty.
- Send signed test events to all three webhook endpoints and confirm replay
  protection.
- Create a checkout session and verify its environment is live mode.
- Confirm the automation KV repair cron converges and billing reconciliation is
  a no-op.

Only reopen signups after every item passes.

## 6. Archive and remove the source deployment

After the smoke test, archive the canonical export to private R2 with its
checksum and retention policy. The source deployment may then be deleted
immediately because there are no active production users and the user accepted
an immediate cutover. Keep `scripts/migrate-convex` and the
`legacy_convex_id` columns until the production import, report sign-off, and R2
archive are all confirmed. Their later removal is intentionally outside this
PR so the cutover remains recoverable.

Create or select a private archive bucket, then upload both files and verify
them before deleting the source deployment:

```bash
pnpm --filter @delulu/http-api exec wrangler r2 object put \
  <private-archive-bucket>/backend-cutover/production-export.zip \
  --file .context/cutover/production-export.zip
pnpm --filter @delulu/http-api exec wrangler r2 object put \
  <private-archive-bucket>/backend-cutover/production-export.zip.sha256 \
  --file .context/cutover/production-export.zip.sha256
```

## Monitoring

For the first production window, watch API/Lambda errors, job dispatch lag,
queue depth, DLQ depth, webhook delivery logs, provider token refresh failures,
and billing reconciliation. A message is retried when the Lambda invocation
fails; after five receives it moves to the DLQ. Permanent validation/auth errors
must be recorded as terminal job failures rather than thrown back to SQS.
