'use client';

import { Button } from '@delulu/design-system/components/ui/button';
import { Switch } from '@delulu/design-system/components/ui/switch';
import { cn } from '@delulu/design-system/lib/utils';
import { getAllPlans, type Plan, type PlanType } from '@delulu/payments';
import Link from 'next/link';
import { useState } from 'react';

const PricingCard = ({
  planId,
  tier,
  subtitle,
  monthlyPrice,
  yearlyPrice,
  isHighlighted = false,
  features,
  isYearly,
  cta = 'Get Started',
}: {
  planId: PlanType;
  tier: string;
  subtitle: string;
  monthlyPrice: number;
  yearlyPrice: number;
  isHighlighted?: boolean;
  features: string[];
  isYearly: boolean;
  cta?: string;
}) => {
  const isFree = monthlyPrice === 0;
  const price = isFree ? monthlyPrice : isYearly ? yearlyPrice : monthlyPrice;

  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 rounded-[37px] p-4',
        isHighlighted
          ? 'border border-primary bg-gradient-to-b from-primary/20 via-primary/10 to-primary/5'
          : 'bg-card'
      )}
    >
      <div className="space-y-8 rounded-[28px] bg-background p-4 px-4 pb-20 shadow-lg">
        <div className="flex flex-col">
          <div className="space-y-2">
            <h3 className="flex w-fit items-center justify-center rounded-full border bg-background px-4 py-1 font-medium text-lg">
              {tier}
            </h3>
            <p className="text-muted-foreground text-sm">{subtitle}</p>
          </div>
          <div className="mt-4 flex items-baseline">
            {isFree ? (
              <span className="font-bold text-4xl">Free Forever</span>
            ) : (
              <>
                <span className="font-bold text-4xl">$</span>
                <span className="font-bold text-4xl">
                  {typeof price === 'number' ? price.toFixed(2) : price}
                </span>
                <span className="ml-1 text-muted-foreground">
                  /{isYearly ? 'year' : 'month'}
                </span>
              </>
            )}
          </div>
          {!isFree && (
            <p className="mt-2 text-muted-foreground text-sm">
              $0.00 due today, cancel anytime
            </p>
          )}
          {isYearly && !isFree && yearlyPrice && (
            <p className="mt-1 font-medium text-primary text-sm">
              Save $
              {((monthlyPrice as number) * 12 - yearlyPrice).toFixed(2)}{' '}
              yearly
            </p>
          )}
        </div>

        <Button
          variant={isHighlighted ? 'default' : 'outline'}
          className="w-full px-6 py-4 font-medium text-md"
          asChild
        >
          <Link href="https://solulu.delulu.social/sign-in">{cta}</Link>
        </Button>

        <ul className="space-y-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <svg
                className={cn(
                  'mr-3 h-5 w-5',
                  isHighlighted ? 'text-primary' : 'text-muted-foreground'
                )}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                />
              </svg>
              <span className="text-muted-foreground text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/**
 * Helper function to convert plan configuration to feature list
 */
const getFeatureList = (plan: Plan): string[] => {
  const features: string[] = [];

  // Limits
  if (plan.limits.socialAccounts > 0 || plan.limits.socialAccounts === -1) {
    features.push(
      plan.limits.socialAccounts === -1
        ? 'Unlimited social accounts'
        : `${plan.limits.socialAccounts} social ${plan.limits.socialAccounts === 1 ? 'account' : 'accounts'}`
    );
  }

  if (plan.limits.monthlyPosts > 0 || plan.limits.monthlyPosts === -1) {
    features.push(
      plan.limits.monthlyPosts === -1
        ? 'Unlimited posts per month'
        : `${plan.limits.monthlyPosts} posts/month`
    );
  }

  if (plan.limits.mediaStorage > 0 || plan.limits.mediaStorage === -1) {
    features.push(
      plan.limits.mediaStorage === -1
        ? 'Unlimited storage'
        : `${plan.limits.mediaStorage >= 1000 ? `${plan.limits.mediaStorage / 1000}GB` : `${plan.limits.mediaStorage}MB`} storage`
    );
  }

  if (plan.limits.teamMembers > 1) {
    features.push(`${plan.limits.teamMembers} team members`);
  }

  // Features
  if (plan.features.advancedScheduling) features.push('Advanced scheduling');
  if (plan.features.analytics) features.push('Advanced analytics');
  if (plan.features.aiContentGeneration) features.push('AI content generation');
  if (plan.features.collaboration) features.push('Team collaboration');
  if (plan.features.prioritySupport) features.push('Priority support');
  if (plan.features.whiteLabel) features.push('White-label branding');
  if (plan.features.customBranding) features.push('Custom branding');
  if (plan.features.bulkUpload) features.push('Bulk upload');

  return features;
};

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  const plans = getAllPlans();

  return (
    <div id="pricing" className="mx-auto max-w-7xl px-4 py-24">
      <div className="mb-16 text-center">
        {/* Urgency Banner */}
        <div className="mx-auto mb-8 w-fit animate-pulse">
          <div className="flex items-center gap-2 rounded-full border-2 border-primary/20 bg-primary/10 px-6 py-3 shadow-lg backdrop-blur-sm">
            <svg
              className="h-5 w-5 text-primary"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-semibold text-foreground text-sm">
              ⚡ Limited Spots: Only 50 founders get current pricing
            </span>
          </div>
        </div>

        <h2 className="mb-4 font-bold text-4xl">
          <span className="text-primary">Simple</span> Pricing for Everyone
        </h2>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Choose the perfect plan for your needs. Start growing your social
          media presence today.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <span
            className={cn(
              'font-medium text-sm',
              isYearly ? 'text-muted-foreground' : 'text-primary'
            )}
          >
            Monthly
          </span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            className="data-[state=checked]:bg-primary"
          />
          <span
            className={cn(
              'font-medium text-sm',
              isYearly ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            Yearly
            <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-primary text-xs">
              Save up to 30%
            </span>
          </span>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <PricingCard
            key={plan.id}
            planId={plan.id}
            tier={plan.name}
            subtitle={plan.description}
            monthlyPrice={plan.price.monthly}
            yearlyPrice={plan.price.yearly}
            features={getFeatureList(plan)}
            isHighlighted={plan.popular || false}
            isYearly={isYearly}
            cta={plan.id === 'FREE' ? 'Start Free' : 'Get Started'}
          />
        ))}
      </div>
    </div>
  );
}
