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
NEXT_PUBLIC_WEB_URL=https://www.delulu.social
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
- ❌ `https://www.delulu.social/`
- ✅ `https://www.delulu.social`

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
NEXT_PUBLIC_WEB_URL = "https://www.delulu.social"
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

## Fixed Issues

### ✅ Sitemap.ts Edge Runtime Fix
- **Problem**: `fs.readdirSync` not supported in Cloudflare Workers edge runtime
- **Solution**: Replaced filesystem operations with static page list
- **Location**: Moved to `app/sitemap.ts` (app root level, not in [locale] folder)

### ✅ Robots.ts Location
- **Location**: `app/robots.ts` (app root level)
- **Fixed**: Removed invalid environment variable usage that caused "Invalid language tag" error

## File Structure for SEO
```
apps/web/
├── app/
│   ├── robots.ts          ← App level (works globally)
│   ├── sitemap.ts         ← App level (works globally)  
│   ├── api/og/route.tsx   ← Dynamic OG image generation
│   └── [locale]/
│       ├── layout.tsx     ← JSON-LD structured data
│       └── ...
```

## Deployment Steps

1. Update environment variables in Cloudflare Workers dashboard
2. Remove trailing slashes from URLs
3. Add missing `RESEND_FROM` to runtime variables
4. Trigger a new deployment

The robots.txt, sitemap.xml, and SEO functionality should now work correctly with these fixes.

## 🤖 AI SEO Optimization

### AI Crawlers Now Allowed
Your robots.txt has been updated to **ALLOW** all major AI crawlers for maximum visibility in AI search results:

- **ChatGPT**: `GPTBot`, `ChatGPT-User`
- **Claude**: `ClaudeBot`, `Claude-Web`  
- **Perplexity**: `PerplexityBot`
- **Google AI**: `Google-Extended`
- **Meta**: `FacebookBot`, `facebookexternalhit`, `meta-externalagent`
- **Microsoft**: `Bingbot`
- **Apple**: `Applebot`
- **Amazon**: `Amazonbot`
- **Common Crawl**: `CCBot`
- **Social Media**: `Twitterbot`, `LinkedInBot`, `WhatsApp`, `TelegramBot`, `DiscordBot`, `Slackbot-LinkExpanding`, `SkypeUriPreview`

### AI-Optimized Content Strategy
- **Conversational keywords**: "how to manage multiple social media accounts"
- **Q&A structured data**: FAQ schema for better AI responses
- **Problem-solving focus**: Targets user pain points
- **Clear, direct answers**: AI prefers concise, factual content

### Expected Benefits
- Appear in ChatGPT, Claude, and Perplexity responses
- Higher quality traffic from AI-driven searches  
- Better conversion rates (Perplexity users convert 243% better)
- Increased brand authority through AI citations

### Monitoring
Track referrals from:
- `openai.com` (ChatGPT)
- `perplexity.ai` (Perplexity)
- `claude.ai` (Anthropic)
- AI search mentions and citations

See `AI-SEO-STRATEGY.md` for complete implementation details.
