"use client";

import { DM_PLAN_LIMITS } from "@delulu/database/convex/schemas/automations";
import { Button } from "@delulu/design-system/components/ui/button";
import { Switch } from "@delulu/design-system/components/ui/switch";
import { cn } from "@delulu/design-system/lib/utils";
import {
  CURRENCY_SYMBOLS,
  getAllPlans,
  type Plan,
  type PlanType,
} from "@delulu/payments";
import Link from "next/link";
import { useState } from "react";
import { useCurrency } from "@/hooks/use-currency";

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
  planId: PlanType;
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
        "relative flex flex-col gap-3 rounded-[37px] p-4",
        isHighlighted
          ? "border border-primary bg-gradient-to-b from-primary/20 via-primary/10 to-primary/5"
          : "bg-card"
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
          className="w-full px-6 py-4 font-medium text-md"
          variant={isHighlighted ? "default" : "outline"}
        >
          <Link href="https://solulu.delulu.social/sign-in">{cta}</Link>
        </Button>

        <ul className="space-y-4">
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

  // DM automation limits
  const dmLimit = DM_PLAN_LIMITS[plan.id];
  if (dmLimit === -1) {
    features.push("Unlimited auto-DMs/month");
  } else if (dmLimit > 0) {
    features.push(`${dmLimit.toLocaleString()} auto-DMs/month`);
  }

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

  const plans = getAllPlans();

  return (
    <div className="mx-auto max-w-7xl px-4 py-24" id="pricing">
      <div className="mb-16 text-center">
        {/* Urgency Banner */}
        <div className="mx-auto mb-8 w-fit animate-pulse">
          <div className="flex items-center gap-2 rounded-full border-2 border-primary/20 bg-primary/10 px-6 py-3 shadow-lg backdrop-blur-sm">
            <svg
              className="h-5 w-5 text-primary"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
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
              Save up to 30%
            </span>
          </span>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <PricingCard
            cta={plan.id === "FREE" ? "Start Free" : "Get Started"}
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
    </div>
  );
}
