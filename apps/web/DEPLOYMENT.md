# Cloudflare Deployment Guide

## Environment Variable Issues Fix

The current deployment error is caused by environment variable configuration issues. Here's how to fix them:

### 1. Required Environment Variables

Add these missing variables to your Cloudflare Workers environment:

#### Runtime Variables (Required for deployment)
```
RESEND_FROM=mail@delulu.social
```

#### Build Variables (Already set, but verify these values)
```
NEXT_PUBLIC_APP_URL=https://solulu.delulu.social
NEXT_PUBLIC_WEB_URL=https://delulu.social
NEXT_PUBLIC_DOCS_URL=https://docs.delulu.social
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_POSTHOG_KEY=phc_A5NWdEHAyUyzoUUSKnemshpamt3MCdbh9ztSxH0RvQV
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cmFwaWQtZG9lLTg3LmNsZXJrLmFjY291bnRzLmRldiQ
```

#### Secret Variables
```
CLERK_SECRET_KEY=<your-secret>
CLERK_WEBHOOK_SECRET=<your-secret>
RESEND_TOKEN=<your-resend-token>
```

### 2. Remove Trailing Slashes

The URLs should NOT have trailing slashes:
- ❌ `https://delulu.social/`
- ✅ `https://delulu.social`

Update your Cloudflare environment variables to remove trailing slashes from:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_WEB_URL`
- `NEXT_PUBLIC_DOCS_URL`

### 3. Robots.txt Fix

The "Invalid language tag" error was caused by incorrect environment variable usage in robots.ts. This has been fixed to use `NEXT_PUBLIC_WEB_URL` instead of `VERCEL_PROJECT_PRODUCTION_URL`.

### 4. OpenNext Configuration

Make sure your `wrangler.toml` or deployment configuration includes:

```toml
[env.production.vars]
NEXT_PUBLIC_WEB_URL = "https://delulu.social"
NEXT_PUBLIC_APP_URL = "https://solulu.delulu.social"
NEXT_PUBLIC_DOCS_URL = "https://docs.delulu.social"
RESEND_FROM = "mail@delulu.social"
```

### 5. Build Commands

Your current build configuration looks correct:
- Build command: `npx opennextjs-cloudflare build`
- Deploy command: `npx opennextjs-cloudflare deploy`

### 6. Compatibility Flags

Keep these compatibility flags enabled:
- `nodejs_compat`
- `global_fetch_strictly_public`

## Troubleshooting

### If robots.txt still fails:
1. Check that `NEXT_PUBLIC_WEB_URL` is set without trailing slash
2. Verify the environment variable is available at runtime
3. Check Cloudflare Workers logs for specific error details

### If environment validation fails:
1. Ensure all required variables are set in both build and runtime environments
2. Remove any duplicate or conflicting variable definitions
3. Verify URLs are valid and don't have trailing slashes

### If email functionality doesn't work:
1. Add `RESEND_FROM` to runtime variables (not just build variables)
2. Verify `RESEND_TOKEN` starts with `re_`
3. Ensure the email address is verified in Resend

## Deployment Steps

1. Update environment variables in Cloudflare Workers dashboard
2. Remove trailing slashes from URLs
3. Add missing `RESEND_FROM` to runtime variables
4. Trigger a new deployment

The robots.txt and SEO functionality should now work correctly with these fixes.