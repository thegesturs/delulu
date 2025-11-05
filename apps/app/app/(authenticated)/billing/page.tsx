'use client';

/**
 * Billing Page
 *
 * Comprehensive billing dashboard showing:
 * - Current subscription plan
 * - Usage statistics
 * - Pricing options for upgrades
 * - Billing management
 */

import { CurrentPlanCard } from '@/components/billing/current-plan-card';
import { PricingCards } from '@/components/billing/pricing-cards';
import { UsageStats } from '@/components/billing/usage-stats';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@delulu/design-system/components/ui/alert';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@delulu/design-system/components/ui/tabs';
import type { PlanType } from '@delulu/payments';
import { BarChart3, CheckCircle2, CreditCard } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * IMPORTANT: Update these product IDs with your actual Dodo product IDs
 * Get these from your Dodo Payments dashboard after creating products
 */
const PRODUCT_IDS: Record<PlanType, { monthly: string; yearly: string }> = {
  FREE: { monthly: '', yearly: '' }, // Free plan doesn't need IDs
  STARTER: {
    monthly: 'prod_starter_monthly_REPLACE_ME',
    yearly: 'prod_starter_yearly_REPLACE_ME',
  },
  PRO: {
    monthly: 'prod_pro_monthly_REPLACE_ME',
    yearly: 'prod_pro_yearly_REPLACE_ME',
  },
  ENTERPRISE: {
    monthly: 'prod_enterprise_monthly_REPLACE_ME',
    yearly: 'prod_enterprise_yearly_REPLACE_ME',
  },
};

export default function BillingPage() {
  const searchParams = useSearchParams();
  const success = searchParams?.get('success');
  const cancelled = searchParams?.get('cancelled');

  // Show success/error messages from checkout redirects
  useEffect(() => {
    if (success === 'true') {
      toast.success('Subscription updated successfully!', {
        description:
          'Your payment has been processed. Welcome to your new plan!',
      });
    } else if (cancelled === 'true') {
      toast.error('Checkout cancelled', {
        description: 'You can upgrade anytime from this page.',
      });
    }
  }, [success, cancelled]);

  return (
    <div className="container mx-auto h-full max-w-7xl space-y-8 overflow-y-auto py-8">
      {/* Page Header */}
      <div>
        <h1 className="font-bold text-3xl tracking-tight">
          Billing & Subscription
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage your subscription, view usage, and upgrade your plan
        </p>
      </div>

      {/* Success Alert */}
      {success === 'true' && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle>Subscription Updated!</AlertTitle>
          <AlertDescription>
            Your payment has been processed successfully. You now have access to
            all premium features.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs for different sections */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-fit">
          <TabsTrigger value="overview" className='w-fit'>
            <CreditCard className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="usage" className='w-fit'>
            <BarChart3 className="mr-2 h-4 w-4" />
            Usage & Limits
          </TabsTrigger>
          <TabsTrigger value="plans" className='w-[200px]'>
            <CreditCard className="mr-1 h-4 w-4" />
            Plans & Pricing
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <CurrentPlanCard />
            <UsageStats />
          </div>

          {/* Quick upgrade CTA */}
          <div className="rounded-lg border border-dashed p-8 text-center">
            <h3 className="mb-2 font-semibold text-lg">Need more features?</h3>
            <p className="mb-4 text-muted-foreground">
              Upgrade your plan to unlock advanced features, higher limits, and
              priority support
            </p>
            <TabsList>
              <TabsTrigger value="plans">View All Plans</TabsTrigger>
            </TabsList>
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <UsageStats />

          {/* Usage tips */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-6">
              <h3 className="mb-2 font-semibold">Optimize Your Usage</h3>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>
                  • Schedule posts in advance to stay within monthly limits
                </li>
                <li>• Compress images before uploading to save storage</li>
                <li>• Disconnect unused social accounts to free up slots</li>
              </ul>
            </div>
            <div className="rounded-lg border p-6">
              <h3 className="mb-2 font-semibold">Understanding Limits</h3>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>• Monthly post limits reset on the 1st of each month</li>
                <li>• Storage includes all media files across all accounts</li>
                <li>• Team members can be added from your account settings</li>
              </ul>
            </div>
          </div>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <div className="mx-auto mb-8 max-w-3xl text-center">
            <h2 className="mb-2 font-bold text-2xl">
              Choose Your Perfect Plan
            </h2>
            <p className="text-muted-foreground">
              Start free and upgrade anytime. All paid plans include a 14-day
              money-back guarantee.
            </p>
          </div>

          <PricingCards
            productIds={PRODUCT_IDS}
            onUpgradeSuccess={() => {
              toast.success('Redirecting to checkout...');
            }}
          />

          {/* FAQ Section */}
          <div className="mx-auto mt-12 max-w-3xl">
            <h3 className="mb-4 font-semibold text-xl">
              Frequently Asked Questions
            </h3>
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-medium">Can I change plans later?</h4>
                <p className="text-muted-foreground text-sm">
                  Yes! You can upgrade or downgrade your plan at any time.
                  Changes take effect immediately for upgrades, or at the end of
                  your billing period for downgrades.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-medium">
                  What payment methods do you accept?
                </h4>
                <p className="text-muted-foreground text-sm">
                  We accept all major credit cards (Visa, MasterCard, American
                  Express) and debit cards through our secure payment processor,
                  Dodo Payments.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-medium">Is there a refund policy?</h4>
                <p className="text-muted-foreground text-sm">
                  Yes! All paid plans come with a 14-day money-back guarantee.
                  If you're not satisfied, contact support for a full refund.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-medium">Can I cancel anytime?</h4>
                <p className="text-muted-foreground text-sm">
                  Absolutely. You can cancel your subscription at any time from
                  the billing portal. You'll retain access until the end of your
                  billing period.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
