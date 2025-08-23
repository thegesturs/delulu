'use client';

import { Button } from '@delulu/design-system/components/ui/button';
import { Switch } from '@delulu/design-system/components/ui/switch';
import { cn } from '@delulu/design-system/lib/utils';
import Link from 'next/link';
import { useState } from 'react';

interface PricingTier {
  monthly: number | 'free';
  yearly?: number;
  features: string[];
  tier: string;
  subtitle: string;
  cta?: string;
}

const PricingCard = ({
  tier,
  subtitle,
  monthlyPrice,
  yearlyPrice,
  isHighlighted = false,
  features,
  isYearly,
  cta = 'Get Started',
}: {
  tier: string;
  subtitle: string;
  monthlyPrice: number | 'free';
  yearlyPrice?: number;
  isHighlighted?: boolean;
  features: string[];
  isYearly: boolean;
  cta?: string;
}) => {
  const isFree = monthlyPrice === 'free';
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
              {((monthlyPrice as number) * 12 - yearlyPrice * 12).toFixed(2)}{' '}
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

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  const pricingTiers: PricingTier[] = [
    {
      tier: 'Free',
      subtitle: 'Perfect for getting started',
      monthly: 'free',
      features: ['Up to 2 Platforms', '15 Scheduled Posts/Month'],
      cta: 'Start Free',
    },
    {
      tier: 'Starter',
      subtitle: 'Best for beginner creators',
      monthly: 12,
      yearly: 8,
      features: [
        '5 connected social accounts',
        'Multiple accounts per platform',
        'Unlimited posts',
        'Schedule posts',
        'Carousel posts',
      ],
    },
    {
      tier: 'Creator',
      subtitle: 'Best for growing creators',
      monthly: 19.99,
      yearly: 17,
      features: [
        '15 connected social accounts',
        'Multiple accounts per platform',
        'Unlimited posts',
        'Schedule posts',
        'Carousel posts',
        'Content studio access',
      ],
    },
    {
      tier: 'Pro',
      subtitle: 'Best for scaling brands',
      monthly: 29.99,
      yearly: 24,
      features: [
        'Unlimited connected accounts',
        'Multiple accounts per platform',
        'Unlimited posts',
        'Schedule posts',
        'Carousel posts',
        'Content studio access',
      ],
    },
  ];

  return (
    <div id="pricing" className="mx-auto max-w-7xl px-4 py-24">
      <div className="mb-16 text-center">
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
      <div className="grid gap-4 md:grid-cols-4">
        {pricingTiers.map((tier, index) => (
          <PricingCard
            key={tier.tier}
            tier={tier.tier}
            subtitle={tier.subtitle}
            monthlyPrice={tier.monthly}
            yearlyPrice={tier.yearly}
            features={tier.features}
            isHighlighted={index === 2}
            isYearly={isYearly}
            cta={tier.cta}
          />
        ))}
      </div>
    </div>
  );
}
