"use client";

/**
 * Pricing Cards Component
 *
 * Displays all available subscription plans with pricing and features
 */

import { Badge } from "@delulu/design-system/components/ui/badge";
import { Button } from "@delulu/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@delulu/design-system/components/ui/card";
import { Switch } from "@delulu/design-system/components/ui/switch";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  CURRENCY_SYMBOLS,
  getMaxYearlySavingsPercent,
  getPublicPlans,
  PLANS,
  type PublicPlanType,
} from "@delulu/payments";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { toast } from "sonner";
import { DottedColumns } from "@/components/layout/dotted-columns";
import { useApiClient } from "@/components/providers/api-client";
import { useCurrency } from "@/hooks/use-currency";
import { useOperationsWorkspace } from "@/hooks/use-operations-workspace";
import { useSubscription } from "@/hooks/use-subscription";
import { useMutationAtom } from "@/state/resources";

interface PricingCardsProps {
  productIds?: Record<PublicPlanType, { monthly: string; yearly: string }>;
  onUpgradeSuccess?: () => void;
  checkoutReturnUrl?: string;
}

export function PricingCards(props: PricingCardsProps) {
  const currency = useCurrency();
  const { resources } = useApiClient();
  const workspace = useOperationsWorkspace();
  const checkout = useMutationAtom(
    resources.billing.checkout(workspace.workspaceId ?? "")
  );
  const portal = useMutationAtom(
    resources.billing.portal(workspace.workspaceId ?? "")
  );
  const currencySymbol = CURRENCY_SYMBOLS[currency];
  const [isAnnual, setIsAnnual] = useState(false);
  const {
    planType: currentPlan,
    billingPeriod: currentBillingPeriod,
    isLifetime,
    isPaid,
    isLoading,
  } = useSubscription();

  const plans = getPublicPlans();
  const yearlySavings = getMaxYearlySavingsPercent();

  const getPlanPrice = (planType: PublicPlanType) => {
    const plan = PLANS[planType];
    return isAnnual
      ? plan.price[currency].yearly
      : plan.price[currency].monthly;
  };

  const getMonthlyEquivalent = (planType: PublicPlanType) => {
    const plan = PLANS[planType];
    const prices = plan.price[currency];
    if (!isAnnual || prices.yearly === 0) {
      return null;
    }
    const yearlyInCents = prices.yearly * 100;
    const monthlyInCents = Math.round(yearlyInCents / 12);
    const monthlyInDollars = monthlyInCents / 100;
    return currency === "INR"
      ? Math.round(monthlyInDollars).toLocaleString("en-IN")
      : monthlyInDollars.toFixed(2);
  };

  const isCurrentPlan = (planType: PublicPlanType) => {
    if (isLoading || currentPlan !== planType) {
      return false;
    }

    // For paid plans, check if both plan type and billing period match
    const selectedPeriod = isAnnual ? "YEARLY" : "MONTHLY";
    return currentBillingPeriod === selectedPeriod;
  };

  return (
    <div className="space-y-4">
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-2">
        <span
          className={`text-sm ${isAnnual ? "text-muted-foreground" : "font-medium"}`}
        >
          Monthly
        </span>
        <Switch
          aria-label="Bill annually"
          checked={isAnnual}
          onCheckedChange={setIsAnnual}
        />
        <span
          className={`text-sm ${isAnnual ? "font-medium" : "text-muted-foreground"}`}
        >
          Annual
          <Badge className="ml-2" variant="secondary">
            Save {yearlySavings}%
          </Badge>
        </span>
      </div>

      {/* Full-bleed dotted rule under the heading block, meeting the frame rails. */}
      <div className="-mx-6 border-zinc-950/10 border-t-[1.5px] border-dotted dark:border-white/10" />

      {/* Pricing cards */}
      <DottedColumns breakpoint="md">
        {plans.map((plan) => {
          const price = getPlanPrice(plan.id);
          const monthlyEquivalent = getMonthlyEquivalent(plan.id);
          const isCurrent = isCurrentPlan(plan.id);

          // Determine button text
          const getButtonText = () => {
            if (isLifetime && plan.id === "VIBE") {
              return "Lifetime Plan";
            }
            if (isCurrent) {
              return "Current Plan";
            }
            // Same plan type but different billing period
            if (plan.id === currentPlan && !isLoading && !isCurrent) {
              return isAnnual ? "Switch to Annual" : "Switch to Monthly";
            }

            return "Choose plan";
          };

          return (
            <Card
              className={`relative flex flex-col ${
                plan.popular ? "border-primary shadow-lg" : ""
              }`}
              key={plan.id}
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
                    <Badge className="ml-2" variant="outline">
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
                      {currencySymbol}
                      {currency === "INR"
                        ? price.toLocaleString("en-IN")
                        : price}
                    </span>
                    {price > 0 && (
                      <span className="text-muted-foreground">
                        /{isAnnual ? "year" : "month"}
                      </span>
                    )}
                  </div>
                  {monthlyEquivalent && (
                    <p className="mt-1 text-muted-foreground text-sm">
                      {currencySymbol}
                      {monthlyEquivalent}/month billed annually
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Icon
                      className="mt-0.5 flex-shrink-0 text-primary"
                      icon={Tick01Icon}
                      size={16}
                    />
                    <span>
                      {plan.limits.socialAccounts === -1
                        ? "Unlimited"
                        : plan.limits.socialAccounts}{" "}
                      social{" "}
                      {plan.limits.socialAccounts === 1
                        ? "account"
                        : "accounts"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon
                      className="mt-0.5 flex-shrink-0 text-primary"
                      icon={Tick01Icon}
                      size={16}
                    />
                    <span>
                      {plan.limits.monthlyPosts === -1
                        ? "Unlimited"
                        : plan.limits.monthlyPosts}{" "}
                      posts per month
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon
                      className="mt-0.5 flex-shrink-0 text-primary"
                      icon={Tick01Icon}
                      size={16}
                    />
                    <span>
                      {plan.limits.mediaStorage === -1
                        ? "Unlimited"
                        : `${plan.limits.mediaStorage}MB`}{" "}
                      media storage
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon
                      className="mt-0.5 flex-shrink-0 text-primary"
                      icon={Tick01Icon}
                      size={16}
                    />
                    <span>Pooled auto-DM usage</span>
                  </li>
                  {plan.limits.organizations > 0 && (
                    <li className="flex items-start gap-2">
                      <Icon
                        className="mt-0.5 flex-shrink-0 text-primary"
                        icon={Tick01Icon}
                        size={16}
                      />
                      <span>
                        {plan.limits.organizations === -1
                          ? "Unlimited"
                          : `Up to ${plan.limits.organizations}`}{" "}
                        {plan.limits.organizations === 1
                          ? "organization"
                          : "organizations"}
                      </span>
                    </li>
                  )}
                  {plan.features.postScheduling && (
                    <li className="flex items-start gap-2">
                      <Icon
                        className="mt-0.5 flex-shrink-0 text-primary"
                        icon={Tick01Icon}
                        size={16}
                      />
                      <span>Post scheduling</span>
                    </li>
                  )}
                  {plan.features.prioritySupport && (
                    <li className="flex items-start gap-2">
                      <Icon
                        className="mt-0.5 flex-shrink-0 text-primary"
                        icon={Tick01Icon}
                        size={16}
                      />
                      <span>Priority support</span>
                    </li>
                  )}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  disabled={isCurrent || checkout.isPending || portal.isPending}
                  onClick={async () => {
                    try {
                      if (isPaid) {
                        const result = await portal.mutateAsync(undefined);
                        window.location.assign(result.url);
                        return;
                      }
                      const configuredReturn = props.checkoutReturnUrl
                        ? new URL(
                            props.checkoutReturnUrl,
                            window.location.origin
                          )
                        : null;
                      const result = await checkout.mutateAsync({
                        plan: plan.id,
                        interval: isAnnual ? "YEARLY" : "MONTHLY",
                        currency,
                        returnPath: configuredReturn
                          ? `${configuredReturn.pathname}${configuredReturn.search}`
                          : undefined,
                      });
                      props.onUpgradeSuccess?.();
                      window.location.assign(result.url);
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Unable to open billing"
                      );
                    }
                  }}
                  size="lg"
                  variant={plan.popular ? "default" : "outline"}
                >
                  {getButtonText()}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </DottedColumns>

      <p className="text-center text-muted-foreground text-sm">
        All plans include 14-day money-back guarantee • Cancel anytime
      </p>
    </div>
  );
}
