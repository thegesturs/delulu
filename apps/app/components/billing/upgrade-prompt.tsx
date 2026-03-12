"use client";

/**
 * Upgrade Prompt Component
 *
 * Shows when a user tries to access a feature/limit they don't have access to
 * Displays the required plan and upgrade button
 */

import { api } from "@delulu/database/convex/_generated/api";
import { Button } from "@delulu/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@delulu/design-system/components/ui/card";
import { Icon } from "@delulu/design-system/providers/icon";
import { CURRENCY_SYMBOLS, PLANS, type PlanType } from "@delulu/payments";
import {
  ArrowRight01Icon,
  LockIcon,
  SparklesIcon,
} from "@hugeicons-pro/core-solid-rounded";
import { useAction } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/use-currency";
import { getAffonsoReferral } from "@/lib/affonso-referral";

interface UpgradePromptProps {
  feature: string;
  requiredPlan?: PlanType;
  currentUsage?: number;
  limit?: number;
  description?: string;
  productId?: string; // Dodo product ID for direct checkout
  className?: string;
}

export function UpgradePrompt({
  feature,
  requiredPlan = "ECHO",
  currentUsage,
  limit,
  description,
  productId,
  className,
}: UpgradePromptProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const createCheckout = useAction(api.subscriptions.createCheckoutSession);
  const currency = useCurrency();
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  const plan = PLANS[requiredPlan];

  const handleUpgrade = async () => {
    if (!productId) {
      // Redirect to billing page if no product ID
      window.location.href = "/billing";
      return;
    }

    try {
      setIsUpgrading(true);
      const { checkout_url } = await createCheckout({
        productId,
        returnUrl: `${window.location.origin}${window.location.pathname}`,
        billingCurrency: currency,
        affonsoReferral: getAffonsoReferral() ?? undefined,
      });
      window.location.href = checkout_url;
    } catch (error) {
      console.error("Failed to create checkout:", error);
      toast.error("Failed to start upgrade. Please try again.");
      setIsUpgrading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="text-muted-foreground" icon={LockIcon} size={20} />
          <CardTitle className="text-xl">{feature} Requires Upgrade</CardTitle>
        </div>
        <CardDescription>
          {description ||
            `This feature requires a ${plan.name} plan or higher to unlock.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage info if provided */}
        {currentUsage !== undefined && limit !== undefined && (
          <div className="rounded-lg bg-muted p-4">
            <p className="text-muted-foreground text-sm">
              You've reached your limit:{" "}
              <strong>
                {currentUsage}/{limit}
              </strong>
            </p>
            <p className="mt-1 text-muted-foreground text-sm">
              Upgrade to {plan.name} for{" "}
              <strong>
                {plan.limits.socialAccounts === -1
                  ? "unlimited"
                  : `up to ${plan.limits.socialAccounts}`}
              </strong>{" "}
              accounts
            </p>
          </div>
        )}

        {/* Plan features */}
        <div className="space-y-2">
          <p className="font-medium text-sm">With {plan.name}, you get:</p>
          <ul className="space-y-1 text-muted-foreground text-sm">
            {plan.features.postScheduling && (
              <li className="flex items-center gap-2">
                <Icon className="text-primary" icon={SparklesIcon} size={16} />
                Post Scheduling
              </li>
            )}
            <li className="flex items-center gap-2">
              <Icon className="text-primary" icon={SparklesIcon} size={16} />
              {plan.limits.monthlyPosts === -1
                ? "Unlimited"
                : `${plan.limits.monthlyPosts}`}{" "}
              posts per month
            </li>
            {plan.features.prioritySupport && (
              <li className="flex items-center gap-2">
                <Icon className="text-primary" icon={SparklesIcon} size={16} />
                Priority Support
              </li>
            )}
          </ul>
        </div>

        {/* Pricing */}
        <div className="rounded-lg bg-primary/10 p-4">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-3xl">
              {currencySymbol}
              {currency === "INR"
                ? plan.price[currency].monthly.toLocaleString("en-IN")
                : plan.price[currency].monthly}
            </span>
            <span className="text-muted-foreground">/month</span>
          </div>
          {plan.price[currency].yearly > 0 && (
            <p className="mt-1 text-muted-foreground text-sm">
              Or {currencySymbol}
              {currency === "INR"
                ? plan.price[currency].yearly.toLocaleString("en-IN")
                : plan.price[currency].yearly}
              /year (save 17%)
            </p>
          )}
        </div>

        {/* CTA Button */}
        <Button
          className="w-full"
          disabled={isUpgrading}
          onClick={handleUpgrade}
          size="lg"
        >
          {isUpgrading ? (
            "Redirecting..."
          ) : (
            <>
              Upgrade to {plan.name}
              <Icon className="ml-2" icon={ArrowRight01Icon} size={16} />
            </>
          )}
        </Button>

        <p className="text-center text-muted-foreground text-xs">
          Cancel anytime • No hidden fees
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Inline upgrade prompt for smaller spaces
 */
export function InlineUpgradePrompt({
  feature,
  requiredPlan = "ECHO",
  productId,
}: Pick<UpgradePromptProps, "feature" | "requiredPlan" | "productId">) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const createCheckout = useAction(api.subscriptions.createCheckoutSession);
  const currency = useCurrency();
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  const plan = PLANS[requiredPlan];

  const handleUpgrade = async () => {
    if (!productId) {
      window.location.href = "/billing";
      return;
    }

    try {
      setIsUpgrading(true);
      const { checkout_url } = await createCheckout({
        productId,
        returnUrl: `${window.location.origin}${window.location.pathname}`,
        billingCurrency: currency,
        affonsoReferral: getAffonsoReferral() ?? undefined,
      });
      window.location.href = checkout_url;
    } catch (error) {
      console.error("Failed to create checkout:", error);
      toast.error("Failed to start upgrade. Please try again.");
      setIsUpgrading(false);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
      <div className="flex items-center gap-3">
        <Icon className="text-muted-foreground" icon={LockIcon} size={20} />
        <div>
          <p className="font-medium">
            {feature} requires {plan.name}
          </p>
          <p className="text-muted-foreground text-sm">
            Starting at {currencySymbol}
            {currency === "INR"
              ? plan.price[currency].monthly.toLocaleString("en-IN")
              : plan.price[currency].monthly}
            /month
          </p>
        </div>
      </div>
      <Button disabled={isUpgrading} onClick={handleUpgrade}>
        {isUpgrading ? "Loading..." : "Upgrade"}
      </Button>
    </div>
  );
}
