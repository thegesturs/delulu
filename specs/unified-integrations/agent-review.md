# Agent Review: Unified Integrations Spec

Review all HTML files under `specs/unified-integrations/files/`. Start at [`files/index.html`](./files/index.html).

You are a staff engineer on Delulu Social (multi-platform scheduling, Instagram auto-DM, org workspaces, Convex, Lambda+SQS publish).

## Your task

Read every HTML page in order (01 → 07). Do **not** implement code. Review the spec and propose amendments only.

## Review criteria

1. **Completeness** — Can Phase 1 (Instagram E2E) be implemented from this spec alone?
2. **Accuracy** — Do file paths match the repo (`packages/worker/providers/`, `connect-url.service.ts`, `apps/app/app/api/callback/`, `platform-rules.ts`)?
3. **Error model** — Is removing `neverthrow` for `IntegrationError` + boundary catch in `worker/client.ts` sound?
4. **Minimalism** — Does anything belong in `07-out-of-scope.html` instead? Anything missing from v1?
5. **Blocking decisions** — Any unresolved choice that stops an engineer on day one?

## Output format

```
## Verdict
APPROVE | APPROVE WITH CHANGES | NEEDS REWORK

## Blocking issues
- (file, section, issue, proposed fix)

## Suggested spec edits
- (file → section → exact change)

## Risks not covered
- (risk + recommendation)

## Optional improvements
- (non-blocking)
```

## Context to verify in the repo

- `packages/worker/client.ts`
- `packages/worker/providers/types.ts`
- `packages/database/convex/posts.ts`
- `packages/infrastructure/sst.config.ts`
- `packages/api/router/social-provider.ts`

If the spec disagrees with the repo, flag it and propose a correction to the relevant HTML file.