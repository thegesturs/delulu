'use client';

/**
 * Pricing Cards Component
 *
 * Displays all available subscription plans with pricing and features
 */

import { Button } from '@delulu/design-system/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@delulu/design-system/components/ui/card';
import { Badge } from '@delulu/design-system/components/ui/badge';
import { Switch } from '@delulu/design-system/components/ui/switch';
import { PLANS, getAllPlans, type PlanType } from '@delulu/payments';
import { useAction } from 'convex/react';
import { Check, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@delulu/database/convex/_generated/api';
import { useSubscription } from '@/hooks/use-subscription';

interface PricingCardsProps {
  productIds?: Record<PlanType, { monthly: string; yearly: string }>;
  onUpgradeSuccess?: () => void;
}

export function PricingCards({ productIds, onUpgradeSuccess }: PricingCardsProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState<PlanType | null>(null);
  const createCheckout = useAction(api.subscriptions.createCheckoutSession);
  const { planType: currentPlan, isLoading } = useSubscription();

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
        returnUrl: `${window.location.origin}/billing?success=true`,
      });
      window.location.href = checkout_url;
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
    return currentPlan === planType && !isLoading;
  };

  return (
    <div className="space-y-8">
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={`text-sm ${!isAnnual ? 'font-medium' : 'text-muted-foreground'}`}>
          Monthly
        </span>
        <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
        <span className={`text-sm ${isAnnual ? 'font-medium' : 'text-muted-foreground'}`}>
          Annual
          <Badge variant="secondary" className="ml-2">
            Save 17%
          </Badge>
        </span>
      </div>

      {/* Pricing cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const price = getPlanPrice(plan.id);
          const monthlyEquivalent = getMonthlyEquivalent(plan.id);
          const isCurrent = isCurrentPlan(plan.id);
          const isUpgrading = upgradingPlan === plan.id;

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${
                plan.popular ? 'border-primary shadow-lg' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
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
                    <span className="text-4xl font-bold">
                      {price === 0 ? 'Free' : `$${price}`}
                    </span>
                    {price > 0 && (
                      <span className="text-muted-foreground">
                        /{isAnnual ? 'year' : 'month'}
                      </span>
                    )}
                  </div>
                  {monthlyEquivalent && (
                    <p className="text-sm text-muted-foreground mt-1">
                      ${monthlyEquivalent}/month billed annually
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>
                      {plan.limits.socialAccounts === -1
                        ? 'Unlimited'
                        : plan.limits.socialAccounts}{' '}
                      social {plan.limits.socialAccounts === 1 ? 'account' : 'accounts'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>
                      {plan.limits.monthlyPosts === -1
                        ? 'Unlimited'
                        : plan.limits.monthlyPosts}{' '}
                      posts per month
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>
                      {plan.limits.mediaStorage === -1
                        ? 'Unlimited'
                        : `${plan.limits.mediaStorage}MB`}{' '}
                      media storage
                    </span>
                  </li>
                  {plan.features.analytics && (
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Advanced analytics</span>
                    </li>
                  )}
                  {plan.features.aiContentGeneration && (
                    <li className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>AI content generation</span>
                    </li>
                  )}
                  {plan.features.collaboration && (
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Team collaboration</span>
                    </li>
                  )}
                  {plan.features.whiteLabel && (
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>White-label</span>
                    </li>
                  )}
                  {plan.features.prioritySupport && (
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
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
                  {isUpgrading
                    ? 'Loading...'
                    : isCurrent
                      ? 'Current Plan'
                      : plan.id === 'FREE'
                        ? 'Get Started'
                        : 'Upgrade'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        All plans include 14-day money-back guarantee • Cancel anytime
      </p>
    </div>
  );
}
