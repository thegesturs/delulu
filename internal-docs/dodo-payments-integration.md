# Dodo Payments Integration Guide

> **Status**: Backend Complete ✅ | Frontend In Progress 🚧
> **Last Updated**: 2025-01-06
> **Replaced**: Stripe (completely removed)

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup & Configuration](#setup--configuration)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [Migration Notes](#migration-notes)

---

## Overview

Delulu Social uses **Dodo Payments** for subscription management and billing. The integration supports:

- **3 Subscription Tiers**:
  - Free (1 social, 10 posts/month)
  - Echo ($4.99/mo, $49/yr - 5 socials, 30 posts/month)
  - Vibe ($9.99/mo, $99/yr - unlimited socials/posts/storage)
- **Feature Gating**: AI generation, analytics, collaboration, white-label
- **Usage Limits**: Social accounts, monthly posts, media storage, team members
- **Payment Processing**: Secure checkout via Dodo Payments
- **Webhook Events**: Real-time subscription updates

### Why Dodo Payments?

- Native Convex integration via `@dodopayments/convex`
- Automatic customer identification with Clerk auth
- Built-in webhook handling with signature verification
- Simple checkout sessions with no frontend SDK required

---

## Architecture

### Tech Stack

```
Frontend (Next.js 15)
    ↓
Convex Actions/Queries
    ↓
Dodo Payments API
    ↓
Webhook → Convex Mutations → Database Updates
```

### Data Flow

1. **User clicks "Upgrade"** → Creates checkout session via Convex action
2. **User completes payment** → Dodo webhook fires
3. **Webhook handler** → Updates subscription in Convex database
4. **Real-time updates** → User sees new plan immediately

### Database Schema

#### Subscriptions Table
```typescript
{
  _id: Id<'subscriptions'>,
  userId: Id<'users'>,
  dodoCustomerId: string,
  dodoSubscriptionId?: string,
  planType: 'FREE' | 'ECHO' | 'VIBE',
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'UNPAID' | 'TRIALING',
  billingPeriod?: 'MONTHLY' | 'YEARLY',
  currentPeriodStart?: number,
  currentPeriodEnd?: number,
  cancelAtPeriodEnd?: boolean,
  metadata?: { productId, priceId, cancelReason }
}
```

#### Transactions Table
```typescript
{
  _id: Id<'transactions'>,
  userId: Id<'users'>,
  subscriptionId?: Id<'subscriptions'>,
  dodoPaymentId: string,
  dodoCustomerId: string,
  amount: number, // in cents
  currency: string,
  status: 'SUCCEEDED' | 'PENDING' | 'FAILED' | 'REFUNDED',
  paidAt?: number,
  failureReason?: string
}
```

---

## Setup & Configuration

### 1. Environment Variables

#### Convex Dashboard (Required)
Set these in **Convex Dashboard → Settings → Environment Variables**:

```bash
DODO_PAYMENTS_API_KEY=dodo_sk_...
DODO_PAYMENTS_ENVIRONMENT=test_mode  # or live_mode
DODO_PAYMENTS_WEBHOOK_SECRET=whsec_...
```

#### Local Environment (Optional, for client)
Add to `/apps/app/.env.local`:

```bash
NEXT_PUBLIC_DODO_PAYMENTS_PUBLIC_KEY=dodo_pk_...
```

### 2. Dodo Dashboard Configuration

#### Create Products
1. Go to [Dodo Payments Dashboard](https://dashboard.dodopayments.com)
2. Create products for each tier:
   - **Starter** - $29/month ($290/year)
   - **Pro** - $79/month ($790/year)
   - **Enterprise** - $199/month ($1990/year)
3. Copy the Product IDs

#### Configure Webhook
Set webhook URL to:
```
https://your-convex-deployment.convex.cloud/dodo-webhook
```

**Events to enable:**
- `payment.succeeded`
- `payment.failed`
- `subscription.active`
- `subscription.cancelled`

### 3. Product ID Mapping

Update `/packages/database/convex/webhooks.ts` with your product IDs:

```typescript
// Line 89-93
let planType: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE' = 'STARTER';

// Map your Dodo product IDs to plan types
if (args.productId === 'prod_starter_monthly_abc123') planType = 'STARTER';
if (args.productId === 'prod_starter_yearly_abc123') planType = 'STARTER';
if (args.productId === 'prod_pro_monthly_xyz456') planType = 'PRO';
if (args.productId === 'prod_pro_yearly_xyz456') planType = 'PRO';
if (args.productId === 'prod_enterprise_monthly_def789') planType = 'ENTERPRISE';
if (args.productId === 'prod_enterprise_yearly_def789') planType = 'ENTERPRISE';
```

---

## Backend Implementation

### Files Structure

```
packages/
├── database/
│   └── convex/
│       ├── dodo.ts                    # Main Dodo integration
│       ├── subscriptions.ts           # Subscription queries/mutations
│       ├── webhooks.ts                # Webhook event handlers
│       ├── http.ts                    # HTTP routes (webhook endpoint)
│       ├── users.ts                   # User queries (updated)
│       ├── convex.config.ts           # Dodo component registration
│       └── schemas/
│           ├── subscriptions.ts       # Subscription schema
│           └── users.ts               # User schema (updated)
└── payments/
    ├── plans.ts                       # Plan configuration & helpers
    ├── keys.ts                        # Environment variable validation
    └── index.ts                       # Exports
```

### Key Functions

#### Create Checkout Session
```typescript
// In your component
const createCheckout = useAction(api.subscriptions.createCheckoutSession);

await createCheckout({
  productId: "prod_starter_monthly_abc123",
  returnUrl: window.location.origin + "/billing?success=true"
});
```

#### Get Current Subscription
```typescript
const subscription = useQuery(api.subscriptions.getCurrentSubscription);
// Returns: { planType: 'PRO', status: 'ACTIVE', ... } or null
```

#### Check Feature Access
```typescript
const access = useQuery(api.subscriptions.checkFeatureAccess, {
  feature: 'aiContentGeneration'
});
// Returns: { hasAccess: true, planType: 'PRO', needsUpgrade: false }
```

#### Check Usage Limits
```typescript
const limit = useQuery(api.subscriptions.checkUsageLimit, {
  limitType: 'socialAccounts',
  currentValue: 5
});
// Returns: { allowed: true, limit: 10, remaining: 5, planType: 'PRO' }
```

#### Get Customer Portal
```typescript
const getPortal = useAction(api.subscriptions.getCustomerPortal);
const { portal_url } = await getPortal({ sendEmail: false });
window.location.href = portal_url;
```

---

## Frontend Implementation

### Plan Configuration

Import from payments package:

```typescript
import { PLANS, getPlan, checkLimit, hasFeature } from '@delulu/payments';

// Get plan details
const plan = getPlan('PRO');
console.log(plan.price.monthly); // 79
console.log(plan.limits.socialAccounts); // 10
console.log(plan.features.aiContentGeneration); // true

// Check limits
const canAdd = checkLimit('PRO', 'socialAccounts', currentCount);

// Check features
const hasAI = hasFeature('PRO', 'aiContentGeneration');
```

### React Hooks (To Be Implemented)

#### useSubscription Hook
```typescript
// apps/app/hooks/use-subscription.ts
import { useQuery } from 'convex/react';
import { api } from '@delulu/database/convex/_generated/api';

export function useSubscription() {
  const subscription = useQuery(api.subscriptions.getCurrentSubscription);

  return {
    subscription,
    planType: subscription?.planType || 'FREE',
    isActive: subscription?.status === 'ACTIVE',
    isPastDue: subscription?.status === 'PAST_DUE',
    isLoading: subscription === undefined,
  };
}
```

#### useFeatureAccess Hook
```typescript
// apps/app/hooks/use-feature-access.ts
import { useQuery } from 'convex/react';
import { api } from '@delulu/database/convex/_generated/api';
import type { PlanFeatures } from '@delulu/payments';

export function useFeatureAccess(feature: keyof PlanFeatures) {
  const access = useQuery(api.subscriptions.checkFeatureAccess, { feature });

  return {
    hasAccess: access?.hasAccess ?? false,
    needsUpgrade: access?.needsUpgrade ?? true,
    planType: access?.planType || 'FREE',
    isLoading: access === undefined,
  };
}
```

### Feature Gating Pattern

```typescript
import { useFeatureAccess } from '@/hooks/use-feature-access';
import { UpgradePrompt } from '@/components/billing/upgrade-prompt';

export function AIGenerationButton() {
  const { hasAccess, needsUpgrade } = useFeatureAccess('aiContentGeneration');

  if (needsUpgrade) {
    return <UpgradePrompt feature="AI Content Generation" requiredPlan="PRO" />;
  }

  return <Button onClick={generateContent}>Generate with AI</Button>;
}
```

### Usage Limit Pattern

```typescript
import { useQuery } from 'convex/react';
import { api } from '@delulu/database/convex/_generated/api';

export function AddSocialAccountButton() {
  const socialProviders = useQuery(api.social_providers.list);
  const limit = useQuery(api.subscriptions.checkUsageLimit, {
    limitType: 'socialAccounts',
    currentValue: socialProviders?.length || 0,
  });

  if (!limit?.allowed) {
    return (
      <UpgradePrompt
        feature="Social Accounts"
        currentUsage={socialProviders?.length}
        limit={limit?.limit}
      />
    );
  }

  return <Button onClick={addAccount}>Add Account</Button>;
}
```

---

## Testing

### Test Mode

Always test with `DODO_PAYMENTS_ENVIRONMENT=test_mode` first.

### Test Cards

Use Dodo Payments test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Expired**: `4000 0000 0000 0069`

### Webhook Testing

Use Dodo CLI or webhook forwarding:

```bash
# Install Dodo CLI
npm install -g @dodopayments/cli

# Forward webhooks to local Convex
dodo webhooks forward https://your-local-convex.convex.site/dodo-webhook
```

### Manual Testing Checklist

- [ ] Create checkout session
- [ ] Complete payment with test card
- [ ] Verify webhook received
- [ ] Check subscription created in database
- [ ] Verify user can access paid features
- [ ] Test customer portal
- [ ] Cancel subscription
- [ ] Verify cancellation webhook
- [ ] Check downgrade to Free plan

---

## Troubleshooting

### Common Issues

#### 1. "No authenticated user found"
**Cause**: User not logged in with Clerk
**Solution**: Ensure Clerk auth is working, check `ctx.auth.getUserIdentity()`

#### 2. "User not found in database"
**Cause**: User not synced from Clerk
**Solution**: Check Clerk webhook (`/clerk-users-webhook`) is configured

#### 3. "Checkout session did not return checkout_url"
**Cause**: Invalid product ID or Dodo API error
**Solution**: Check product ID mapping and Dodo API key

#### 4. "Customer portal did not return portal_url"
**Cause**: User has no Dodo customer ID
**Solution**: User must complete one checkout first to create customer

#### 5. Webhook not firing
**Cause**: Webhook URL not configured or signature mismatch
**Solution**:
- Verify webhook URL in Dodo dashboard
- Check `DODO_PAYMENTS_WEBHOOK_SECRET` matches
- View webhook logs in Dodo dashboard

### Debug Logging

All Dodo operations log to Convex logs:
```
[Dodo] Identified user: cj123... user@example.com
[Dodo Webhook] Payment succeeded: pay_abc123
[Webhook] Transaction recorded for user: cj123...
```

View logs:
```bash
npx convex logs
```

---

## Migration Notes

### From Stripe

**Removed:**
- `stripe` package
- `@stripe/agent-toolkit` package
- `/packages/payments/ai.ts` (Stripe AI toolkit)
- All Stripe environment variables

**Updated:**
- `/packages/payments/keys.ts` - Now validates Dodo keys
- `/packages/payments/index.ts` - Exports plans instead of Stripe client
- `/apps/app/env.ts` - Imports payments keys

### Schema Changes

**Users table** - Added fields:
```typescript
{
  dodoCustomerId?: string,
  subscriptionId?: Id<'subscriptions'>
}
```

**New tables:**
- `subscriptions` - Subscription records
- `transactions` - Payment history

---

## Quick Reference

### Environment Variables
```bash
# Convex Dashboard (Required)
DODO_PAYMENTS_API_KEY=dodo_sk_...
DODO_PAYMENTS_ENVIRONMENT=test_mode
DODO_PAYMENTS_WEBHOOK_SECRET=whsec_...

# Frontend (Optional)
NEXT_PUBLIC_DODO_PAYMENTS_PUBLIC_KEY=dodo_pk_...
```

### Key Files
- **Backend**: `packages/database/convex/subscriptions.ts`
- **Webhooks**: `packages/database/convex/webhooks.ts`
- **Plans**: `packages/payments/plans.ts`
- **HTTP**: `packages/database/convex/http.ts`

### Important URLs
- Dodo Dashboard: https://dashboard.dodopayments.com
- Dodo Docs: https://docs.dodopayments.com
- Webhook URL: `https://your-convex.convex.cloud/dodo-webhook`

### Support
- Dodo Support: support@dodopayments.com
- Dodo Slack: [Join Community](https://dodopayments.com/slack)

---

## Next Steps

### Immediate Tasks
1. ✅ Set environment variables in Convex dashboard
2. ✅ Create products in Dodo dashboard
3. ✅ Update product ID mapping in `webhooks.ts`
4. ✅ Configure webhook URL
5. 🚧 Implement frontend hooks
6. 🚧 Build billing UI components
7. 🚧 Add feature gates throughout app
8. 🚧 Test end-to-end flow

### Future Enhancements
- [ ] Add annual billing discount banners
- [ ] Implement usage-based pricing
- [x] Add referral program (Affonso affiliate integration)
- [ ] Create admin dashboard for subscription management
- [ ] Add email notifications for payment events
- [ ] Implement grace period for failed payments
- [ ] Add analytics for conversion rates

---

**Last Updated**: 2025-01-06
**Maintainer**: Development Team
**Version**: 1.0.0
