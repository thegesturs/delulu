"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { Switch } from "@delulu/design-system/components/ui/switch";
import { cn } from "@delulu/design-system/lib/utils";
import {
  CURRENCY_SYMBOLS,
  DM_PLAN_LIMITS,
  formatDmLimit,
  getMaxYearlySavingsPercent,
  getPublicPlans,
  type Plan,
  type PublicPlanType,
} from "@delulu/payments";
import { Github } from "lucide-react";
import { useState } from "react";
import { useCurrency } from "@/hooks/use-currency";
import { LANDING_LINKS } from "@/lib/landing-links";
import { TrackedLandingLink } from "./tracked-landing-link";

const PricingCard = ({
  planId,
  tier,
  subtitle,
  monthlyPrice,
  yearlyPrice,
  isHighlighted = false,
  features,
  isYearly,
  cta = "Get Started",
  currencySymbol,
  isINR,
}: {
  planId: PublicPlanType;
  tier: string;
  subtitle: string;
  monthlyPrice: number;
  yearlyPrice: number;
  isHighlighted?: boolean;
  features: string[];
  isYearly: boolean;
  cta?: string;
  currencySymbol: string;
  isINR: boolean;
}) => {
  const isFree = monthlyPrice === 0;
  const price = isFree ? monthlyPrice : isYearly ? yearlyPrice : monthlyPrice;
  const formatNum = (n: number) =>
    isINR ? Math.round(n).toLocaleString("en-IN") : n.toFixed(2);

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-3xl p-3 ring-1 ring-foreground/10",
        isHighlighted ? "bg-primary/10 ring-primary/40" : "bg-card"
      )}
    >
      <div className="flex h-full flex-col rounded-[1.1rem] bg-background p-6 shadow-sm md:p-8">
        <div className="flex flex-col">
          <div className="space-y-2">
            <h3 className="flex w-fit items-center justify-center rounded-full bg-muted px-4 py-1.5 font-medium text-base ring-1 ring-foreground/10">
              {tier}
            </h3>
            <p className="text-muted-foreground text-sm">{subtitle}</p>
          </div>
          <div className="mt-7 flex items-baseline">
            {isFree ? (
              <span className="font-bold text-4xl">Free Forever</span>
            ) : (
              <>
                <span className="font-bold text-4xl">{currencySymbol}</span>
                <span className="font-bold text-4xl">{formatNum(price)}</span>
                <span className="ml-1 text-muted-foreground">
                  /{isYearly ? "year" : "month"}
                </span>
              </>
            )}
          </div>
          {!isFree && (
            <p className="mt-2 text-muted-foreground text-sm">
              {currencySymbol}0 due today, cancel anytime
            </p>
          )}
          {isYearly && !isFree && yearlyPrice && (
            <p className="mt-1 font-medium text-primary text-sm">
              Save {currencySymbol}
              {formatNum((monthlyPrice as number) * 12 - yearlyPrice)} yearly
            </p>
          )}
        </div>

        <Button
          asChild
          className="mt-8 h-11 w-full px-6 font-medium"
          variant={isHighlighted ? "default" : "outline"}
        >
          <TrackedLandingLink
            destination="hosted_app"
            href={LANDING_LINKS.app}
            surface="pricing"
          >
            {cta}
          </TrackedLandingLink>
        </Button>

        <ul className="mt-8 space-y-4">
          {features.map((feature, index) => (
            <li className="flex items-center" key={index}>
              <svg
                className={cn(
                  "mr-3 h-5 w-5",
                  isHighlighted ? "text-primary" : "text-muted-foreground"
                )}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  fillRule="evenodd"
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
        ? "Unlimited social accounts"
        : `${plan.limits.socialAccounts} social ${plan.limits.socialAccounts === 1 ? "account" : "accounts"}`
    );
  }

  if (plan.limits.monthlyPosts > 0 || plan.limits.monthlyPosts === -1) {
    features.push(
      plan.limits.monthlyPosts === -1
        ? "Unlimited posts per month"
        : `${plan.limits.monthlyPosts} posts/month`
    );
  }

  if (plan.limits.mediaStorage > 0 || plan.limits.mediaStorage === -1) {
    features.push(
      plan.limits.mediaStorage === -1
        ? "Unlimited storage"
        : `${plan.limits.mediaStorage >= 1000 ? `${plan.limits.mediaStorage / 1000}GB` : `${plan.limits.mediaStorage}MB`} storage`
    );
  }

  if (plan.limits.teamMembers > 1) {
    features.push(`${plan.limits.teamMembers} team members`);
  }

  if (plan.limits.organizations > 0) {
    features.push(
      plan.limits.organizations === -1
        ? "Unlimited organizations"
        : `Up to ${plan.limits.organizations} organization${plan.limits.organizations === 1 ? "" : "s"}`
    );
  }

  // DM automation limits
  const dmLimit = DM_PLAN_LIMITS[plan.id];
  features.push(`${formatDmLimit(dmLimit)} auto-DMs/month`);

  // Features
  if (plan.features.postScheduling) {
    features.push("Post scheduling");
  }
  if (plan.features.prioritySupport) {
    features.push("Priority support");
  }

  return features;
};

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const currency = useCurrency();
  const currencySymbol = CURRENCY_SYMBOLS[currency];
  const isINR = currency === "INR";

  const plans = getPublicPlans();
  const yearlySavings = getMaxYearlySavingsPercent();

  return (
    <section className="border-t px-4 py-24 md:px-6 lg:py-32" id="pricing">
      <div className="mb-16 text-center">
        <p className="font-mono font-semibold text-primary text-xs uppercase tracking-[0.2em]">
          Pricing
        </p>
        <h2 className="mx-auto mt-4 max-w-4xl font-semibold text-4xl tracking-[-0.045em] md:text-6xl">
          Hosted when you want it.{" "}
          <span className="text-primary">Open source</span> when you don&apos;t.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-8">
          Use our managed service or run the Community edition on your own
          infrastructure.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <span
            className={cn(
              "font-medium text-sm",
              isYearly ? "text-muted-foreground" : "text-primary"
            )}
          >
            Monthly
          </span>
          <Switch
            checked={isYearly}
            className="data-[state=checked]:bg-primary"
            onCheckedChange={setIsYearly}
          />
          <span
            className={cn(
              "font-medium text-sm",
              isYearly ? "text-primary" : "text-muted-foreground"
            )}
          >
            Yearly
            <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-primary text-xs">
              Save {yearlySavings}%
            </span>
          </span>
        </div>
      </div>
      <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
        {plans.map((plan) => (
          <PricingCard
            cta="Get Started"
            currencySymbol={currencySymbol}
            features={getFeatureList(plan)}
            isHighlighted={plan.popular}
            isINR={isINR}
            isYearly={isYearly}
            key={plan.id}
            monthlyPrice={plan.price[currency].monthly}
            planId={plan.id}
            subtitle={plan.description}
            tier={plan.name}
            yearlyPrice={plan.price[currency].yearly}
          />
        ))}
      </div>
      <div className="mx-auto mt-5 max-w-5xl rounded-3xl bg-card p-7 ring-1 ring-foreground/10 md:flex md:items-center md:justify-between md:gap-8">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-2xl">Community self-hosted</h3>
            <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-xs">
              AGPL-3.0
            </span>
          </div>
          <p className="mt-2 text-muted-foreground">
            Core scheduling, publishing, agent interfaces, workspaces, reviews,
            and automations unlocked. You cover infrastructure and external
            provider costs.
          </p>
        </div>
        <Button
          asChild
          className="mt-5 h-11 shrink-0 md:mt-0"
          variant="outline"
        >
          <TrackedLandingLink
            destination="source"
            href={LANDING_LINKS.source}
            surface="community_pricing"
          >
            <Github aria-hidden="true" className="mr-2 size-4" />
            Self-host free
          </TrackedLandingLink>
        </Button>
      </div>
    </section>
  );
}
