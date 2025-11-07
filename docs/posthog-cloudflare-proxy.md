# PostHog Cloudflare Worker Reverse Proxy Setup

This guide explains how to set up a Cloudflare Worker as a reverse proxy for PostHog analytics to bypass ad blockers and tracking prevention tools.

## Overview

The platform uses a smart fallback approach:
1. First tries to connect directly to PostHog (`us.i.posthog.com`)
2. If blocked, automatically falls back to our Cloudflare proxy (`metrics.delulu.social`)
3. This minimizes Cloudflare Worker costs while ensuring reliable analytics

## Architecture

```
Browser → metrics.delulu.social (Cloudflare Worker) → us.i.posthog.com (PostHog)
```

The Cloudflare Worker:
- Forwards API requests to `us.i.posthog.com`
- Caches static assets from `us-assets.i.posthog.com`
- Removes cookie headers for privacy
- Works on Cloudflare's free tier (100k requests/day)

## Setup Instructions

### 1. Create Cloudflare Worker

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **Create**
3. Click **Create Worker**
4. Name it `posthog-proxy` (or any name you prefer)
5. Click **Deploy**

### 2. Add Worker Code

Click **Edit Code** and replace all content with:

```javascript
const API_HOST = "us.i.posthog.com" // Change to "eu.i.posthog.com" for EU region
const ASSET_HOST = "us-assets.i.posthog.com" // Change to "eu-assets.i.posthog.com" for EU region

async function handleRequest(request, ctx) {
  const url = new URL(request.url)
  const pathname = url.pathname
  const search = url.search
  const pathWithParams = pathname + search

  if (pathname.startsWith("/static/")) {
      return retrieveStatic(request, pathWithParams, ctx)
  } else {
      return forwardRequest(request, pathWithParams)
  }
}

async function retrieveStatic(request, pathname, ctx) {
  let response = await caches.default.match(request)
  if (!response) {
      response = await fetch(`https://${ASSET_HOST}${pathname}`)
      ctx.waitUntil(caches.default.put(request, response.clone()))
  }
  return response
}

async function forwardRequest(request, pathWithSearch) {
  const originRequest = new Request(request)
  originRequest.headers.delete("cookie")
  return await fetch(`https://${API_HOST}${pathWithSearch}`, originRequest)
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, ctx);
  }
};
```

Click **Deploy** when done.

### 3. Add Custom Domain

1. On the worker page, go to **Settings** → **Triggers**
2. In the **Custom Domains** section, click **Add Custom Domain**
3. Enter: `metrics.delulu.social`
4. Click **Add Domain**

Cloudflare will automatically:
- Create the DNS record
- Provision SSL certificate
- Route traffic to your worker

### 4. Verify Environment Variables

The following environment variables are already configured in the codebase:

**Local Development** (`.env.example`):
```bash
NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
NEXT_PUBLIC_POSTHOG_PROXY_HOST="https://metrics.delulu.social"
```

**Production** (`wrangler.jsonc`):
```json
{
  "NEXT_PUBLIC_POSTHOG_HOST": "https://us.i.posthog.com",
  "NEXT_PUBLIC_POSTHOG_PROXY_HOST": "https://metrics.delulu.social"
}
```

## How It Works

### Smart Fallback Logic

The PostHog client automatically detects if the direct host is blocked:

```typescript
// In packages/analytics/posthog/client.tsx
const initPostHog = async () => {
  let apiHost = NEXT_PUBLIC_POSTHOG_HOST; // Try direct first

  if (NEXT_PUBLIC_POSTHOG_PROXY_HOST) {
    try {
      await fetch(apiHost, { method: 'HEAD', mode: 'no-cors' });
    } catch (error) {
      apiHost = NEXT_PUBLIC_POSTHOG_PROXY_HOST; // Fallback to proxy
    }
  }

  posthog.init(key, { api_host: apiHost });
};
```

### Cost Optimization

This approach minimizes costs because:
- Users without ad blockers → Direct to PostHog (free)
- Users with ad blockers → Through Cloudflare (minimal requests)
- Static assets are cached by Cloudflare (no repeated fetches)

Cloudflare Free Tier includes:
- 100,000 requests/day
- 10ms CPU time per request
- Global edge network

## Testing

### Test Direct Connection
```bash
curl -I https://us.i.posthog.com
```

### Test Cloudflare Proxy
```bash
curl -I https://metrics.delulu.social
```

### Test in Browser
1. Open your app: https://solulu.delulu.social
2. Open browser DevTools → Network tab
3. Filter for "posthog" or "metrics"
4. Look for requests to either:
   - `us.i.posthog.com` (direct connection)
   - `metrics.delulu.social` (proxied connection)

### Test with Ad Blocker
1. Enable an ad blocker (e.g., uBlock Origin)
2. Visit your app
3. Check Network tab - should see `metrics.delulu.social` requests
4. Verify PostHog events in PostHog dashboard

## Troubleshooting

### Worker Not Receiving Traffic

**Check DNS:**
```bash
dig metrics.delulu.social
```

Should return Cloudflare IP addresses.

**Check Worker Logs:**
1. Go to Cloudflare Dashboard → Workers & Pages
2. Click your worker → Logs
3. Check for errors or requests

### PostHog Events Not Appearing

**Verify environment variables:**
```bash
# In your app directory
echo $NEXT_PUBLIC_POSTHOG_PROXY_HOST
```

**Check browser console:**
```javascript
// In browser DevTools console
console.log(process.env.NEXT_PUBLIC_POSTHOG_PROXY_HOST)
```

**Check PostHog initialization:**
- Look for PostHog errors in browser console
- Verify api_host is set correctly
- Check Network tab for failed requests

### CORS Errors

The worker should handle CORS automatically. If you see CORS errors:

1. Check that requests include proper headers
2. Verify the worker is forwarding requests correctly
3. Check that the origin domain is allowed

### Worker Hitting Rate Limits

If you exceed 100k requests/day:

**Option 1:** Upgrade Cloudflare plan
- Workers Paid: $5/month + $0.50/million requests

**Option 2:** Optimize caching
- Increase cache TTL for static assets
- Use Cloudflare Cache API more aggressively

**Option 3:** Contact PostHog about dedicated proxy

## Monitoring

### Cloudflare Analytics

View worker metrics:
1. Cloudflare Dashboard → Workers & Pages
2. Click your worker → Metrics
3. Monitor:
   - Requests per day
   - Success rate
   - CPU time
   - Errors

### PostHog Analytics

Verify data flow:
1. PostHog Dashboard → Project Settings
2. Check for recent events
3. Verify user identification is working
4. Check for any client-side errors

## Configuration Files

The following files have been updated to support the proxy:

- `/packages/analytics/keys.ts` - Environment variable validation
- `/packages/analytics/posthog/client.tsx` - Smart fallback logic
- `/apps/app/.env.example` - Development environment template
- `/apps/web/.env.example` - Development environment template
- `/apps/app/wrangler.jsonc` - Production config for dashboard app
- `/apps/web/wrangler.jsonc` - Production config for marketing site

## Security Considerations

### Privacy
- Worker removes cookie headers before forwarding to PostHog
- No PII is stored in Cloudflare
- All requests use HTTPS end-to-end

### Performance
- Static assets cached at edge (fast loading)
- DNS resolution optimized by Cloudflare
- Global CDN reduces latency

### Reliability
- Fallback ensures analytics always work
- Cloudflare's 99.99% uptime SLA
- Automatic failover to direct connection if worker fails

## For EU Region

If your PostHog project is in the EU region, update the worker code:

```javascript
const API_HOST = "eu.i.posthog.com"
const ASSET_HOST = "eu-assets.i.posthog.com"
```

And update environment variables:
```bash
NEXT_PUBLIC_POSTHOG_HOST="https://eu.i.posthog.com"
```

## Additional Resources

- [PostHog Reverse Proxy Documentation](https://posthog.com/docs/advanced/proxy)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [PostHog JavaScript SDK](https://posthog.com/docs/libraries/js)

## Support

For issues or questions:
- PostHog: [PostHog Docs](https://posthog.com/docs)
- Cloudflare: [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- Internal: Contact the platform team
