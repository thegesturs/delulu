# Delulu staging Worker

This shared staging entrypoint currently validates Meta webhook setup without
loading Delulu's production API bindings. It never reads or acknowledges POST
bodies: inbound events receive `503` with `Retry-After` until durable agent
ingress is connected, so a successful response cannot silently drop a message.

## Routes

- `GET /health`
- `GET /v1/providers/whatsapp/webhook` for Meta's subscription challenge
- `POST /v1/providers/whatsapp/webhook` fails closed until agent ingress exists

## Local development

Copy `.dev.vars.example` to `.dev.vars`, fill the verification token, then run:

```sh
pnpm --filter @delulu/staging dev
```

The callback URL is
`http://localhost:8787/v1/providers/whatsapp/webhook`. Meta itself requires a
public HTTPS URL, so use the deployed staging Worker for dashboard validation.
You can exercise the local challenge with:

```sh
curl --get 'http://localhost:8787/v1/providers/whatsapp/webhook' \
  --data-urlencode 'hub.mode=subscribe' \
  --data-urlencode 'hub.verify_token=YOUR_LOCAL_VERIFY_TOKEN' \
  --data-urlencode 'hub.challenge=delulu-local-ok'
```

## Deployment

Deploy the Worker, then store the verification token as a Wrangler secret:

```sh
pnpm --filter @delulu/staging run deploy
pnpm --filter @delulu/staging exec wrangler secret put WHATSAPP_VERIFY_TOKEN
```

Use the deployed origin plus `/v1/providers/whatsapp/webhook` as Meta's callback
URL. Dashboard verification requires only `WHATSAPP_VERIFY_TOKEN`; the Meta app
secret and phone-number ID are needed later when durable POST ingress is wired.
Rotate staging secrets before reusing the configuration in production.

The shared staging origin is `https://delulu-staging.whizzy.workers.dev`.
The old hostname is temporarily served by `wrangler.legacy.toml`, which forwards
requests unchanged through a service binding. It owns no provider secrets.
Remove that compatibility Worker only after all Meta subscriptions use the new
origin. Normal deployments and secret commands always target `@delulu/staging`.
