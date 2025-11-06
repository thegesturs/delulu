'use client';

/**
 * Pricing Cards Component
 *
 * Displays all available subscription plans with pricing and features
 */

import { useSubscription } from '@/hooks/use-subscription';
import { api } from '@delulu/database/convex/_generated/api';
import { Badge } from '@delulu/design-system/components/ui/badge';
import { Button } from '@delulu/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@delulu/design-system/components/ui/card';
import { Switch } from '@delulu/design-system/components/ui/switch';
import { PLANS, type PlanType, getAllPlans } from '@delulu/payments';
import { useAction } from 'convex/react';
import { Check, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface PricingCardsProps {
  productIds?: Record<PlanType, { monthly: string; yearly: string }>;
  onUpgradeSuccess?: () => void;
}

export function PricingCards({
  productIds,
  onUpgradeSuccess,
}: PricingCardsProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState<PlanType | null>(null);
  const createCheckout = useAction(api.subscriptions.createCheckoutSession);
  const {
    planType: currentPlan,
    billingPeriod: currentBillingPeriod,
    isLoading
  } = useSubscription();

  const plans = getAllPlans();

  const handleUpgrade = async (planType: PlanType) => {
    // Free plan doesn't need checkout
    if (planType === 'FREE') {
      window.location.href = '/billing?plan=free';
      return;
    }

    // Get product ID for the selected plan and billing period
    const productId = isAnnual
      ? productIds?.[planType]?.yearly
      : productIds?.[planType]?.monthly;

    if (!productId) {
      toast.error('Plan configuration error. Please contact support.');
      return;
    }

    try {
      setUpgradingPlan(planType);
      const { checkout_url } = await createCheckout({
        productId,
        returnUrl: `${window.location.origin}/billing`,
      });
      window.location.href = checkout_url;
      onUpgradeSuccess?.();
    } catch (error) {
      console.error('Failed to create checkout:', error);
      toast.error('Failed to start checkout. Please try again.');
      setUpgradingPlan(null);
    }
  };

  const getPlanPrice = (planType: PlanType) => {
    const plan = PLANS[planType];
    return isAnnual ? plan.price.yearly : plan.price.monthly;
  };

  const getMonthlyEquivalent = (planType: PlanType) => {
    const plan = PLANS[planType];
    if (!isAnnual || plan.price.yearly === 0) return null;
    return Math.round(plan.price.yearly / 12);
  };

  const isCurrentPlan = (planType: PlanType) => {
    if (isLoading || currentPlan !== planType) {
      return false;
    }

    // Free plan doesn't have billing period
    if (planType === 'FREE') {
      return true;
    }

    // For paid plans, check if both plan type and billing period match
    const selectedPeriod = isAnnual ? 'YEARLY' : 'MONTHLY';
    return currentBillingPeriod === selectedPeriod;
  };

  return (
    <div className="space-y-8">
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-4">
        <span
          className={`text-sm ${isAnnual ? 'text-muted-foreground' : 'font-medium'}`}
        >
          Monthly
        </span>
        <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
        <span
          className={`text-sm ${isAnnual ? 'font-medium' : 'text-muted-foreground'}`}
        >
          Annual
          <Badge variant="secondary" className="ml-2">
            Save 17%
          </Badge>
        </span>
      </div>

      {/* Pricing cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const price = getPlanPrice(plan.id);
          const monthlyEquivalent = getMonthlyEquivalent(plan.id);
          const isCurrent = isCurrentPlan(plan.id);
          const isUpgrading = upgradingPlan === plan.id;

          // Determine button text
          const getButtonText = () => {
            if (isUpgrading) return 'Loading...';
            if (isCurrent) return 'Current Plan';
            if (plan.id === 'FREE') return 'Get Started';

            // Same plan type but different billing period
            if (plan.id === currentPlan && !isLoading && !isCurrent) {
              return isAnnual ? 'Switch to Annual' : 'Switch to Monthly';
            }

            return 'Upgrade';
          };

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${
                plan.popular ? 'border-primary shadow-lg' : ''
              }`}
            >
              {plan.popular && (
                <div className="-top-3 -translate-x-1/2 absolute left-1/2">
                  <Badge className="bg-primary">Most Popular</Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {isCurrent && (
                    <Badge variant="outline" className="ml-2">
                      Current
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="min-h-[40px]">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-6">
                {/* Pricing */}
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-4xl">
                      {price === 0 ? 'Free' : `$${price}`}
                    </span>
                    {price > 0 && (
                      <span className="text-muted-foreground">
                        /{isAnnual ? 'year' : 'month'}
                      </span>
                    )}
                  </div>
                  {monthlyEquivalent && (
                    <p className="mt-1 text-muted-foreground text-sm">
                      ${monthlyEquivalent}/month billed annually
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>
                      {plan.limits.socialAccounts === -1
                        ? 'Unlimited'
                        : plan.limits.socialAccounts}{' '}
                      social{' '}
                      {plan.limits.socialAccounts === 1
                        ? 'account'
                        : 'accounts'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>
                      {plan.limits.monthlyPosts === -1
                        ? 'Unlimited'
                        : plan.limits.monthlyPosts}{' '}
                      posts per month
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>
                      {plan.limits.mediaStorage === -1
                        ? 'Unlimited'
                        : `${plan.limits.mediaStorage}MB`}{' '}
                      media storage
                    </span>
                  </li>
                  {plan.features.analytics && (
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span>Advanced analytics</span>
                    </li>
                  )}
                  {plan.features.aiContentGeneration && (
                    <li className="flex items-start gap-2">
                      <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span>AI content generation</span>
                    </li>
                  )}
                  {plan.features.collaboration && (
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span>Team collaboration</span>
                    </li>
                  )}
                  {plan.features.whiteLabel && (
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span>White-label</span>
                    </li>
                  )}
                  {plan.features.prioritySupport && (
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span>Priority support</span>
                    </li>
                  )}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || isUpgrading || isLoading}
                  variant={plan.popular ? 'default' : 'outline'}
                  className="w-full"
                  size="lg"
                >
                  {getButtonText()}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-muted-foreground text-sm">
        All plans include 14-day money-back guarantee • Cancel anytime
      </p>
    </div>
  );
}
