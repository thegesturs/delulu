# Affiliate Program Integration (Affonso + Dodo Payments)

> **Status**: Complete ✅
> **Platform**: [Affonso](https://affonso.io)
> **Payment Processor**: Dodo Payments (existing integration)

---

## Overview

Delulu Social uses **Affonso** as its affiliate management platform, integrated with **Dodo Payments** for automatic commission attribution. When a visitor arrives via an affiliate link, their referral ID is tracked and passed through to the payment checkout so Affonso can attribute the sale and handle payouts.

### How It Works

```
Affiliate shares link → Visitor clicks → Affonso pixel sets cookie
    → Visitor signs up (tracked as lead) → Visitor upgrades
    → Referral ID passed in checkout metadata → Dodo processes payment
    → Dodo webhook notifies Affonso → Commission attributed → Payout
```

### Why Affonso (Not Dub Partners)

- **Handles payouts** automatically (PayPal, Wise, Crypto) — no manual work
- **Dedicated affiliate dashboards** for partners to track performance
- **Automated commission tracking** tied directly to Dodo Payments webhooks
- Dub Partners requires you to manage payouts yourself

---

## Architecture

### Files Modified/Created

```
apps/
├── app/
│   ├── app/layout.tsx                              # Affonso tracking pixel (app)
│   ├── hooks/
│   │   ├── use-affonso-referral.ts                 # Cookie/URL param reader (NEW)
│   │   └── use-onboarding.ts                       # Signup tracking added
│   └── components/billing/
│       ├── pricing-cards.tsx                        # Passes referral to checkout
│       ├── checkout-button.tsx                      # Passes referral to checkout
│       ├── upgrade-prompt.tsx                       # Passes referral to checkout
│       └── sorted-addon-card.tsx                    # Passes referral to checkout
├── web/
│   ├── app/layout.tsx                              # Affonso tracking pixel (marketing)
│   └── components/
│       └── affonso-cross-domain.tsx                # Cross-domain referral forwarding (NEW)
packages/
└── database/convex/
    └── subscriptions.ts                            # Accepts & passes affonsoReferral metadata
```

### Data Flow

1. **Affiliate shares link** — e.g. `https://delulu.social?atp=abc123`
2. **Affonso pixel fires** — sets `affonso_referral` cookie on marketing site
3. **Cross-domain handoff** — `AffonsoCrossDomain` component appends `?aff=<referral>` to all app links
4. **App reads referral** — `getAffonsoReferral()` checks cookie first, then `?aff` URL param
5. **Checkout includes referral** — passed as `metadata.affonso_referral` in Dodo checkout payload
6. **Dodo webhook fires** — Affonso receives the webhook and matches the referral
7. **Commission attributed** — appears in Affonso dashboard, payout scheduled

---

## Setup & Configuration

### Environment Variables

Add to both `apps/app` and `apps/web` environments:

```bash
# Affonso Program ID (required to enable affiliate tracking)
NEXT_PUBLIC_AFFONSO_PROGRAM_ID=your_program_id_here
```

The tracking pixel **only loads** when this env var is set. Without it, no affiliate code runs.

### Affonso Dashboard Setup

1. **Create account** at [affonso.io](https://affonso.io)
2. **Create a program** — set commission rates, cookie duration, payout rules
3. **Connect Dodo Payments**:
   - Go to **Program Details > Connect**
   - Click the **Dodo Payments integration** card
   - Paste your Dodo Payments API key (from Dodo Dashboard > Developer > API Keys)
   - Click **Connect**
4. **Add webhook to Dodo Payments**:
   - In Dodo Dashboard, go to **Developer > Webhooks**
   - Click **Add Webhook**
   - Paste the **Affonso webhook URL** (from your Affonso program settings)
   - Save and **copy the signing key**
   - Paste the signing key back into Affonso under **Dodo Payments webhook settings**
5. **Copy your Program ID** — set it as `NEXT_PUBLIC_AFFONSO_PROGRAM_ID`

### Deployment Checklist

- [ ] Set `NEXT_PUBLIC_AFFONSO_PROGRAM_ID` in Cloudflare Workers env (both `apps/app` and `apps/web`)
- [ ] Add Affonso webhook URL to Dodo Payments dashboard
- [ ] Paste Dodo webhook signing key into Affonso
- [ ] Create at least one affiliate in Affonso for testing
- [ ] Test full flow with a test affiliate link (see Testing section)

---

## Implementation Details

### Tracking Pixel

Both layouts (`apps/web` and `apps/app`) include the Affonso pixel in `<head>`:

```tsx
{process.env.NEXT_PUBLIC_AFFONSO_PROGRAM_ID && (
  <script
    async
    defer
    data-affonso={process.env.NEXT_PUBLIC_AFFONSO_PROGRAM_ID}
    data-cookie_duration="90"
    src="https://affonso.io/js/pixel.min.js"
  />
)}
```

- **Cookie duration**: 90 days (configurable via `data-cookie_duration`)
- **Cookie name**: `affonso_referral`
- Only loads when the env var is set

### Reading the Referral ID

`apps/app/hooks/use-affonso-referral.ts` exports `getAffonsoReferral()`:

```typescript
export function getAffonsoReferral(): string | null
```

**Priority order:**
1. `affonso_referral` cookie (set by Affonso pixel — canonical source)
2. `?aff` URL parameter (cross-domain hand-off from marketing site)
3. `?affonso_referral` URL parameter (fallback)

This is a plain function (not a React hook) called at checkout time.

### Cross-Domain Tracking

Since the marketing site (`delulu.social`) and app (`solulu.delulu.social`) are on different domains, cookies don't carry across. The `AffonsoCrossDomain` client component in `apps/web` handles this:

```
Marketing site (delulu.social)           App (solulu.delulu.social)
┌─────────────────────────┐              ┌────────────────────────┐
│ Affonso pixel sets      │              │ getAffonsoReferral()   │
│ affonso_referral cookie │              │ reads ?aff param       │
│                         │  ?aff=xyz    │ from URL               │
│ AffonsoCrossDomain      │──────────────│                        │
│ appends ?aff to all     │              │ Passes to checkout     │
│ app links on page       │              │ metadata               │
└─────────────────────────┘              └────────────────────────┘
```

The component runs on mount, finds all `<a>` tags pointing to the app domain, and appends `?aff=<referral>` to their URLs.

### Checkout Metadata

`createCheckoutSession` in `packages/database/convex/subscriptions.ts` accepts an optional `affonsoReferral` string:

```typescript
createCheckoutSession({
  productId: "pdt_xxx",
  returnUrl: "/billing",
  billingCurrency: "USD",
  affonsoReferral: getAffonsoReferral() ?? undefined,  // <-- affiliate tracking
})
```

When present, it's included in the Dodo checkout payload:

```typescript
metadata: {
  affonso_referral: "cmdhq6ayf..."
}
```

Affonso picks this up via the Dodo webhook and attributes the commission.

### Signup Tracking (Lead Attribution)

In `apps/app/hooks/use-onboarding.ts`, after successful onboarding completion:

```typescript
if (window.Affonso) {
  window.Affonso.signup(user.primaryEmailAddress.emailAddress);
}
```

This logs the signup as a **LEAD** in Affonso if the user came via an affiliate link. It provides funnel visibility (click → lead → sale) for affiliates.

---

## Testing

### Test Locally

1. Set `NEXT_PUBLIC_AFFONSO_PROGRAM_ID` in your `.env.local` for both apps
2. Visit the marketing site with `?atp=test` appended to the URL
3. Open DevTools > Application > Cookies — verify `affonso_referral` is set
4. Click any "Get Started" link — verify `?aff=...` is appended to the URL
5. In the app, trigger a checkout — check server logs for `metadata.affonso_referral`

### Test in Dodo Test Mode

- Use Dodo test mode (`DODO_PAYMENTS_ENVIRONMENT=test_mode`)
- Use 100% discount codes in Dodo for testing without real payments
- Note: Dodo test mode transactions **won't appear** in Affonso (use live mode for full end-to-end)

### Testing Checklist

- [ ] Affonso pixel loads on marketing site (check Network tab)
- [ ] Affonso pixel loads on app (check Network tab)
- [ ] `affonso_referral` cookie is set when visiting with affiliate link
- [ ] Cross-domain: `?aff=` param is appended to app links on marketing site
- [ ] `getAffonsoReferral()` returns the referral ID in the app
- [ ] Checkout payload includes `metadata.affonso_referral`
- [ ] Signup tracking fires `window.Affonso.signup()` after onboarding
- [ ] Commission appears in Affonso dashboard after payment (live mode only)

---

## Troubleshooting

### Affonso pixel not loading
**Cause**: `NEXT_PUBLIC_AFFONSO_PROGRAM_ID` env var not set
**Solution**: Add it to your environment (Cloudflare Workers, `.env.local`, etc.)

### Cookie not set after clicking affiliate link
**Cause**: Affiliate link format incorrect or pixel not loaded
**Solution**: Affiliate links should use `?atp=<affiliate_id>` format. Check that the pixel script loads in the Network tab.

### Referral not passing to checkout
**Cause**: Cookie expired or cross-domain handoff failed
**Solution**: Check `getAffonsoReferral()` returns a value. Verify `AffonsoCrossDomain` is mounted on the marketing site.

### Commission not attributed in Affonso
**Cause**: Webhook not configured or signing key mismatch
**Solution**: Verify the Affonso webhook URL is added in Dodo dashboard and the signing key matches. Check Dodo webhook logs for delivery failures.

### Cross-domain tracking not working
**Cause**: `AffonsoCrossDomain` component not finding app links
**Solution**: Ensure `NEXT_PUBLIC_APP_URL` is set correctly. The component matches links by hostname against this URL.

---

## Key URLs

- **Affonso Dashboard**: https://affonso.io
- **Affonso Help Center**: https://affonso.io/help
- **Dodo Affiliates Docs**: https://docs.dodopayments.com/features/affiliates
- **Affonso Dodo Integration Guide**: https://affonso.io/help/integrations/dodo/dodo-checkout-api
- **Affonso Support**: support@affonso.io

---

**Last Updated**: 2026-03-12
**Maintainer**: Development Team
