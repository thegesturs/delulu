# Onboarding System - Setup Complete! 🎉

## What's Been Implemented

### ✅ Foundation (Completed)
1. **TypeScript Types** - Custom JWT session claims defined in `/types/globals.d.ts`
2. **Environment Variables** - Clerk redirect URLs configured in `/apps/app/.env.local`
3. **Middleware** - Onboarding redirect logic in `/apps/app/middleware.ts`
4. **Onboarding Route** - Full route with layout and page at `/apps/app/app/onboarding/`
5. **Server Actions** - Clerk metadata updates in `/apps/app/app/onboarding/_actions.ts`

### ✅ State Management (Completed)
6. **Zustand Store** - UI state management in `/apps/app/store/onboarding.ts`
7. **Custom Hook** - Combined Clerk + Zustand + PostHog in `/apps/app/hooks/use-onboarding.ts`

### ✅ UI Components (Completed)
8. **OnboardingStepper** - Main orchestrator component
9. **OnboardingProgress** - Progress indicator (●●○ Step 2 of 3)
10. **WelcomeStep** - Step 1 with hero and benefits
11. **ConnectAccountsStep** - Step 2 with real-time OAuth integration
12. **PricingStep** - Step 3 with pricing cards

### ✅ Feature Tour (Completed)
13. **Driver.js Integration** - Installed and configured
14. **FeatureTour Component** - Auto-starts after onboarding
15. **Tour Markers** - data-tour attributes added to:
    - Dashboard stats
    - Create Post button
    - Posts navigation
    - Calendar navigation
    - Connected Accounts navigation

### ✅ Analytics (Completed)
16. **PostHog Events** - Tracking implemented for:
    - `onboarding_started`
    - `onboarding_step_completed`
    - `onboarding_step_skipped`
    - `onboarding_completed`
    - `onboarding_tour_started`
    - `onboarding_tour_completed`
    - `onboarding_tour_dismissed`

---

## ⚠️ Manual Configuration Required

### 1. Configure Clerk Session Token (CRITICAL)

You need to add custom claims to your Clerk session token:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to your app
3. Go to **Sessions** → **Customize session token**
4. Add the following to the **Claims** editor:

```json
{
  "metadata": "{{user.public_metadata}}"
}
```

5. Click **Save**

**Why this is needed**: The middleware needs to access `onboardingComplete` from the session token to determine if users should be redirected to `/onboarding`.

---

## How It Works

### User Journey

```
1. User signs up → Clerk forces redirect to /onboarding
                    ↓
2. Onboarding Layout checks metadata.onboardingComplete
                    ↓
   false → Show 3-step onboarding
                    ↓
3. Step 1: Welcome (benefits overview)
                    ↓
4. Step 2: Connect social accounts (requires 1+)
                    ↓
5. Step 3: View pricing plans
                    ↓
6. Complete onboarding → metadata.onboardingComplete = true
                    ↓
7. Redirect to / → Auto-start feature tour
                    ↓
8. 6-step Driver.js tour highlights key features
                    ↓
9. Normal dashboard usage
```

### State Management

- **Clerk publicMetadata** stores:
  - `onboardingComplete: boolean`
  - `currentStep: number`
  - `stepsCompleted: string[]`
  - `skippedSteps: string[]`
  - `tourCompleted: boolean`
  - `tourDismissed: boolean`

- **Zustand** manages:
  - `currentStep` (UI state)
  - `accountsConnected` (real-time count)

---

## Testing the Onboarding Flow

### 1. Test with a new user account:

```bash
# Start the dev server
cd apps/app
pnpm dev
```

1. Sign up with a new account
2. You'll be redirected to `/onboarding`
3. Go through the 3 steps
4. After completion, you'll see the feature tour

### 2. Test skipping functionality:

- Each step has a "Skip this step" button
- Skipped steps are tracked in `metadata.skippedSteps`
- Analytics events fire for each skip

### 3. Reset onboarding (for testing):

You can call the `resetOnboarding` server action from settings to test the flow again.

---

## Customization Options

### Change Step Content

Edit the step components in `/apps/app/components/onboarding/`:
- `welcome-step.tsx` - Modify benefits, hero text
- `connect-accounts-step.tsx` - Change platforms shown
- `pricing-step.tsx` - Modify pricing display

### Adjust Tour Steps

Edit `/apps/app/components/onboarding/feature-tour.tsx`:
- Modify the `steps` array
- Change popover titles/descriptions
- Adjust positioning (`side`, `align`)

### Update Analytics Events

Edit `/apps/app/hooks/use-onboarding.ts`:
- Add/modify PostHog events
- Track additional metadata
- Change event names

---

## Environment Variables

The following are now configured in `/apps/app/.env.local`:

```bash
# Clerk Redirects (Both dev and prod sections)
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/onboarding
```

---

## Dependencies Installed

- **driver.js** (v1.4.0) - Feature tour library (5kb gzipped)

---

## File Structure

```
apps/app/
├── app/
│   ├── (authenticated)/
│   │   └── layout.tsx                    # ✨ Added FeatureTour
│   └── onboarding/
│       ├── layout.tsx                    # ✨ NEW
│       ├── page.tsx                      # ✨ NEW
│       └── _actions.ts                   # ✨ NEW
├── components/
│   ├── dashboard/
│   │   └── dashboard-stats.tsx          # ✨ Added data-tour attr
│   ├── layout/
│   │   └── sidebar.tsx                  # ✨ Added data-tour attrs
│   └── onboarding/                       # ✨ NEW DIRECTORY
│       ├── connect-accounts-step.tsx
│       ├── feature-tour.tsx
│       ├── onboarding-progress.tsx
│       ├── onboarding-stepper.tsx
│       ├── pricing-step.tsx
│       └── welcome-step.tsx
├── hooks/
│   └── use-onboarding.ts                 # ✨ NEW
├── store/
│   └── onboarding.ts                     # ✨ NEW
└── middleware.ts                         # ✨ Updated

types/
└── globals.d.ts                          # ✨ NEW
```

---

## Next Steps

1. **Configure Clerk session token** (see above)
2. **Test with a new user account**
3. **Customize step content** if needed
4. **Adjust tour steps** based on your UI
5. **Monitor PostHog** for onboarding analytics

---

## Troubleshooting

### Issue: Middleware redirect loop
**Solution**: Ensure Clerk session token has the custom claims configured

### Issue: Tour not starting
**Solution**: Check that `data-tour` attributes exist on elements and user has completed onboarding

### Issue: Can't skip step 2 without connecting account
**Expected**: The "Continue" button on Step 2 requires at least 1 connected account. Use "Skip this step" instead.

---

## Support

For questions or issues:
1. Check the plan file: `.claude/plans/drifting-drifting-mochi.md`
2. Review component code for inline documentation
3. Check PostHog events to debug tracking issues

---

**Estimated Implementation Time**: 18-22 hours
**Actual Time**: Completed in this session!

Enjoy your new onboarding system! 🚀
