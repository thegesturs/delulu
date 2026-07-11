# `@delulu/http-api` — Effect worker (backend revamp)

The new Cloudflare Worker serving the typed `HttpApi` contract
(`@delulu/contracts`) plus our own OAuth 2.1 Authorization Server. Built in M1;
domain resources landed in M2 and the M3/M4 surfaces are now assembled. **Staging-only** until the M6 cutover — the
production Hono worker lives in `apps/api-legacy` (wrangler `name = "delulu-api"`,
untouched). This worker deploys as `delulu-api-next`.

## Surface (M1–M4)

- `GET /health` — liveness + `SELECT 1` DB probe.
- `GET /v1/me`, `GET /v1/me/workspaces` — identity tier (JIT-provisions the user
  + personal workspace on first authenticated request).
- `GET /openapi.json`, `GET /docs` (Scalar) — generated from the contract.
- OAuth 2.1 AS: `/.well-known/oauth-authorization-server` (RFC 8414),
  `/.well-known/jwks.json`, `/.well-known/oauth-protected-resource` (RFC 9728),
  `/oauth/authorize`, `/oauth/authorize/finalize`, `/oauth/token`,
  `/oauth/revoke`.
- Workspace posts, targets, reviews, media, connections, members, API keys,
  automations, runs, inbox, operational analytics, live insights, billing,
  pooled usage, transactions, and billing-owner transfers under `/v1`.
- `GET|POST /webhooks/meta`, `POST /webhooks/clerk`, and
  `POST /webhooks/dodo` with signature verification and durable replay claims.
- Minute Cron dispatches durable jobs, repairs automation KV, expires quota
  reservations, reconciles pooled counters, and corrects drift.

## Auth

One bearer scheme, three verifiers dispatched by token shape:

- `dsk_…` → API key (frozen role + scopes, workspace-bound).
- JWT with `iss` = our AS → our ES256 access token (`sub`/`scope`/`aud`).
- otherwise → Clerk session JWT (networkless, via `CLERK_JWT_KEY`).

After identity resolution the middleware enforces the per-credential rate limit
(API keys: plan `apiRatePerMinute`; sessions: flat `SESSION_RATE_PER_MINUTE`).
Authorization (`role ∩ scopes`) and quota (block-at-creation → 402) are wired for
the M2 workspace-tier endpoints.

## Local development

```sh
# 1. Start local Postgres and apply migrations (from packages/db).
pnpm --filter @delulu/db pg:up
pnpm --filter @delulu/db pg:migrate

# 2. Run the worker (uses DATABASE_URL + the in-memory rate limiter).
DATABASE_URL=postgres://delulu:delulu@localhost:5432/delulu \
  pnpm --filter @delulu/http-api dev
```

Generate an ES256 signing key for the AS (PKCS#8 PEM) and set `AS_SIGNING_KEY`
(+ optional `AS_SIGNING_KID`). Set `CLERK_JWT_KEY` to your Clerk instance's PEM
public key and `CLERK_ISSUER` to its issuer to accept real session JWTs.

## Tests

- `pnpm --filter @delulu/http-api test:integration` — e2e over `toWebHandler` against
  a real Postgres (`DATABASE_URL`), with a stub Clerk verifier and the in-memory
  rate limiter: health, signed/invalid/replayed webhooks, JIT `/v1/me`,
  `/v1/me/workspaces`, M2 resources, 401/429, AS metadata, and the full
  authorization-code → token → refresh → reuse-detection flow.

## First deploy runbook (code-only in M1 — no deploy yet)

When ready to stand up staging:

1. **Postgres** — provision the staging database; apply `packages/db/migrations`.
2. **Hyperdrive** — `wrangler hyperdrive create delulu-next --connection-string …`;
   uncomment the `[[hyperdrive]]` block in `wrangler.toml` with the returned id.
3. **Rate-limit bindings** — uncomment the four `[[unsafe.bindings]]` ratelimit
   blocks (limits 20/60/120/300, period 60). One binding per distinct limit.
4. **KV** — create and bind `API_USAGE_KV`, `AUTOMATION_KV`, and
   `EDGE_CACHE_KV`; the latter two hold automation trigger/session fast paths
   and versioned analytics/provider caches. Postgres remains authoritative.
5. **Secrets** — `wrangler secret put` for `CLERK_JWT_KEY`, `AS_SIGNING_KEY`,
   `AS_SIGNING_KID`, `META_APP_SECRET`, `META_VERIFY_TOKEN`,
   `CLERK_WEBHOOK_SECRET`, and `DODO_WEBHOOK_SECRET`. Set `CLERK_ISSUER`,
   `AS_ISSUER`, `API_RESOURCE`, `APP_BASE_URL` in `[vars]`.
6. **Deploy** — `pnpm --filter @delulu/http-api deploy` (name stays `delulu-api-next`).
7. **Smoke** — `GET /health`, `GET /openapi.json`, `GET /v1/me` with a Clerk dev
   JWT, and the scripted AS flow (discovery → authorize+PKCE → token → refresh).

The worker `name` must never become `delulu-api` before M6 — that would collide
with the production worker in `apps/api-legacy`.
