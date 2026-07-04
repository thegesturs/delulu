# @delulu/integrations

Single source of truth for social-platform integrations. Replaces the scattered
`worker/providers`, `connect-url.service.ts`, `platform-rules.ts` slices, and
per-platform callback routes. Errors are modelled with **Effect** (not
neverthrow / not raw throws).

## Two entry points — the runtime split (Path A)

The frontend (`apps/app`) and tRPC (`packages/api`) run on **Cloudflare Workers
(workerd)**; the publish worker runs on **AWS Lambda (Node)**. Publishing pulls
in Node-only deps (`axios`, `googleapis`) that do not run on workerd, so the
package is split:

| Import | Runtime | Contains |
|--------|---------|----------|
| `@delulu/integrations` | isomorphic (workerd + Node) | `meta`, `auth`, `rules`, `settings`, `webhooks`, `queries`, registry, token service, Effect error model |
| `@delulu/integrations/worker` | Node only | everything above **plus** `publish` (axios/googleapis) + `runPublish` boundary |

**Hard rule:** `src/index.ts` must never import `publish.ts` / `publish-registry.ts`
/ `runtime.ts`. Publish code is reached only through `worker-entry.ts`. This is
what keeps the Cloudflare bundle free of Node-only code. `definition.ts` (the
isomorphic `PlatformIntegration`) deliberately has **no `publish` field**.

## Error model

`IntegrationError` (`src/errors.ts`) is one `Data.TaggedError` carrying
`{ code, provider, message, retryable }`. Publishers return
`Effect.Effect<PostResult, IntegrationError, ConvexClient>`. The worker boundary
(`runPublish`) runs the Effect, and rethrows only `retryable` failures so SQS
re-delivers after the visibility timeout.

| code | retryable |
|------|-----------|
| `RATE_LIMITED`, `NETWORK_ERROR`, `TOKEN_EXPIRED`, `MEDIA_PROCESSING_TIMEOUT`, `API_ERROR` (5xx) | ✅ |
| `INVALID_MEDIA`, `PROFILE_NOT_FOUND`, `PUBLISH_REJECTED`, `MEDIA_PROCESSING_FAILED`, `API_ERROR` (4xx) | ❌ |

## Adding a platform

Copy `src/platforms/instagram/`, implement `meta / auth / rules / settings /
publish` (+ optional `webhooks / queries`), then register the isomorphic half in
`registry.ts` and the publisher in `publish-registry.ts`.

## Migration status

- ✅ Phase 1 — scaffold, Effect core, **Instagram**, worker boundary, connect-URL delegation
- ⬜ Phase 2 — remaining 9 platforms
- ⬜ Phase 3 — collapse `platform-rules.ts`
- ⬜ Phase 4 — dynamic `/api/callback/[provider]` + api port + delete `connect-url.service.ts`
- ⬜ Phase 5 — remove `neverthrow`, delete legacy `worker/providers`
