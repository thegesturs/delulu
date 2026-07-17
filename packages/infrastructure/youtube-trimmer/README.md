# YouTube trimmer Lambda

Container Lambda (yt-dlp + ffmpeg) that powers the marketing YouTube trimmer at
`/tools/youtube-video-trimmer`. yt-dlp is the only reliable way to extract
YouTube (ciphers, client fallback, PoToken, section download) — none of which
runs on Cloudflare Workers, so this lives on AWS Lambda.

**Flow:** browser → `apps/web` `/api/tools/youtube` (same-origin, rate-limited)
→ this Lambda (Function URL, shared secret) → `yt-dlp --download-sections`
downloads ONLY the requested seconds → ffmpeg muxes → streamed back as MP4.

The Upload tab in the UI stays 100% client-side (ffmpeg.wasm); it never hits
this Lambda.

## Contents

- `Dockerfile` — Lambda node20 base + static ffmpeg/ffprobe + `yt-dlp_linux`.
- `index.mjs` — streaming handler. POST `{ url, start, end, maxHeight? }` → MP4.
- SST wiring lives in `../sst.config.ts`. `awsx.ecr.Image` builds + pushes this
  Dockerfile to ECR during `sst deploy` — there is no separate build/push script.

## Deploy

`sst deploy` builds the image, pushes it to a managed ECR repo, and wires up the
Lambda + Function URL in one shot. You just need the Docker daemon running and an
AWS session.

```bash
# 0. First time only: fetch the awsx provider referenced by sst.config.ts.
cd packages/infrastructure
pnpm sst install                    # (or: pnpm sst add awsx)

# 1. Log in + set the shared auth secret (one time; any random hex works).
aws sso login --profile delulu_social
pnpm sst secret set YoutubeTrimmerAuthSecret "$(openssl rand -hex 32)" --stage production

# 2. Deploy — builds the container, pushes to ECR, deploys the Lambda.
pnpm sst deploy --stage production
# → outputs YoutubeTrimmerApiEndpoint (the Function URL)

# 3. Point the web app at it (Cloudflare secrets on delulu-social-landing).
cd ../../apps/web
wrangler secret put YOUTUBE_TRIMMER_URL      # paste the Function URL from step 2
wrangler secret put YOUTUBE_TRIMMER_SECRET   # paste the SAME value as YoutubeTrimmerAuthSecret
```

For **local dev**, put both in `apps/web/.env.local`:

```
YOUTUBE_TRIMMER_URL=<function-url-or-local-shim>
YOUTUBE_TRIMMER_SECRET=<same-secret>
```

## Guardrails

- **Reserved concurrency = 5** (in `sst.config.ts`): hard cap on parallel
  invocations — bounds cost and avoids getting our IP rate-limited by YouTube.
- **Per-IP limit** (8 trims / 10 min) enforced at the `apps/web` edge via KV.
- **Shared secret** (`X-Trim-Secret`) so the public Function URL can't be abused.
- **Clip length cap** `MAX_CLIP_SECONDS=600` (env) bounds output size + runtime.

## Maintenance

- **Update yt-dlp** (YouTube changes often): the Dockerfile pulls the latest
  yt-dlp on build, so just re-run `pnpm sst deploy --stage production` — awsx
  rebuilds the image and rolls the Lambda to the new digest.
- **Age-restricted videos**: bake a `cookies.txt` from a burner account into the
  image and set `YT_COOKIES_FILE=/var/task/cookies.txt`. Not enabled by default.
- AWS egress is a datacenter IP; if YouTube's bot rate climbs, add cookies and/or
  a residential proxy (`--proxy` in `index.mjs`).
