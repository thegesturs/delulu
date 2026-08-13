# Delulu Agent Runtime

This directory owns the separately deployed Content HQ runtime. It is intentionally outside the root pnpm workspace and requires Node 24 plus pnpm 11.

The upstream source is a git submodule pinned to one reviewed revision. Delulu-specific trusted RPC methods are kept in `patches/` and are applied only to `.build/cloudflare-os`; the submodule must remain clean. This makes every upgrade a visible source and trust-boundary review.

## Prepare and verify

```sh
git submodule update --init infra/agent-runtime/upstream
cd infra/agent-runtime
corepack enable
pnpm check
pnpm prepare
pnpm install:runtime
pnpm build
```

Copy `deployment.example.json` to the ignored `deployment.json` and fill the Cloudflare account and Worker names. Create the named AI Gateway with platform provider credentials, then put an API token with AI Gateway Run and Workers AI Run permissions on the Workshop Worker:

```sh
cd .build/cloudflare-os/packages/workshop-backend
corepack pnpm exec wrangler secret put CF_AI_GATEWAY_API_TOKEN \
  --name delulu-agent-runtime
```

Keep the token in the runtime Worker only; it must never be placed in a user workspace or the Delulu API Worker. Run `pnpm deploy -- --dry-run` to build and validate every generated Worker configuration before `pnpm deploy` performs the real deployment.

External turns are capped at four model steps, a 32k-token input window, and 4k output tokens per step. Delulu atomically reserves $0.50 of internal budget before dispatch and reconciles the actual gateway usage afterward.

The Workshop Worker exposes `ExternalMessageGateway` to the Delulu API only through a service binding with `{ "source": "delulu" }` props. Bind the API Worker back to itself as `AGENT_RUNTIME_BRIDGE` with entrypoint `AgentRuntimeBridge` so persistent response targets survive Worker restarts. After the runtime exists, redeploy `apps/api` so its `AGENT_RUNTIME` binding resolves.

The API Worker also requires `CASPIAN_API_KEY` and `CASPIAN_WEBHOOK_SECRET`; Caspian must deliver signed events to `/webhooks/communications`. R2 credentials remain on the API Worker so inbound attachments are copied into Delulu storage before the durable agent receives their canonical URLs. The API Worker's `AI` binding transcribes archived voice notes up to 10 MB with Workers AI before their transcript is submitted to the runtime.

The ordinary Delulu Worker contains no machine-provider SDK or secret. A full Linux runner is an independently deployed, default-disabled administrative fallback.

## Upgrade rule

Never float or automatically update the submodule. To upgrade: change the pin, review the full upstream diff, rebase the patch, run the upstream suite plus Delulu contract/isolation tests, canary the runtime, and only then promote it. Reverting the runtime deployment or disabling the workspace flag is the rollback path.
