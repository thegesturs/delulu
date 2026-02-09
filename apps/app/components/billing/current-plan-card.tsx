"use client";

/**
 * Current Plan Card Component
 *
 * Displays the user's active subscription plan with details and management options
 */

import { api } from "@delulu/database/convex/_generated/api";
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
import { Icon } from "@delulu/design-system/providers/icon";
import { CURRENCY_SYMBOLS, PLANS } from "@delulu/payments";
import {
  Calendar01Icon,
  CreditCardIcon,
  Link01Icon,
  SparklesIcon,
} from "@hugeicons-pro/core-solid-rounded";
import { useAction } from "convex/react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/use-currency";
import { useSubscription } from "@/hooks/use-subscription";

export function CurrentPlanCard() {
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const getPortal = useAction(api.subscriptions.getCustomerPortal);
  const subscription = useSubscription();
  const currency = useCurrency();
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  const plan = PLANS[subscription.planType];

  const handleManageSubscription = async () => {
    try {
      setIsLoadingPortal(true);
      const { portal_url } = await getPortal();
      window.location.href = portal_url;
    } catch (error) {
      console.error("Failed to open customer portal:", error);
      toast.error("Failed to open billing portal. Please try again.");
      setIsLoadingPortal(false);
    }
  };

  if (subscription.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Loading subscription details...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {plan.name} Plan
              {subscription.isPaid && (
                <Badge variant="default">
                  <Icon className="mr-1" icon={SparklesIcon} size={12} />
                  Active
                </Badge>
              )}
              {subscription.isPastDue && (
                <Badge variant="destructive">Past Due</Badge>
              )}
              {subscription.isCancelled && (
                <Badge variant="secondary">Cancelled</Badge>
              )}
            </CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </div>
          {subscription.isPaid && (
            <Button
              disabled={isLoadingPortal}
              onClick={handleManageSubscription}
              size="sm"
              variant="outline"
            >
              {isLoadingPortal ? "Loading..." : "Manage"}
              <Icon className="ml-2" icon={Link01Icon} size={12} />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Pricing */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-3xl">
              {plan.price[currency].monthly === 0
                ? "Free"
                : `${currencySymbol}${currency === "INR" ? plan.price[currency].monthly.toLocaleString("en-IN") : plan.price[currency].monthly}`}
            </span>
            {plan.price[currency].monthly > 0 && (
              <span className="text-muted-foreground">/month</span>
            )}
          </div>
          {subscription.isPaid && subscription.currentPeriodEnd && (
            <div className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
              <Icon icon={Calendar01Icon} size={16} />
              {subscription.cancelAtPeriodEnd ? (
                <span>
                  Expires on{" "}
                  {format(subscription.currentPeriodEnd, "MMM dd, yyyy")}
                </span>
              ) : (
                <span>
                  Renews on{" "}
                  {format(subscription.currentPeriodEnd, "MMM dd, yyyy")}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Plan Features */}
        <div>
          <h4 className="mb-3 font-medium">Your Plan Includes:</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Social Accounts</span>
              <span className="font-medium">
                {plan.limits.socialAccounts === -1
                  ? "Unlimited"
                  : plan.limits.socialAccounts}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Monthly Posts</span>
              <span className="font-medium">
                {plan.limits.monthlyPosts === -1
                  ? "Unlimited"
                  : plan.limits.monthlyPosts}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Media Storage</span>
              <span className="font-medium">
                {plan.limits.mediaStorage === -1
                  ? "Unlimited"
                  : `${plan.limits.mediaStorage}MB`}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Team Members</span>
              <span className="font-medium">
                {plan.limits.teamMembers === -1
                  ? "Unlimited"
                  : plan.limits.teamMembers}
              </span>
            </li>
          </ul>
        </div>

        {/* Premium Features */}
        {subscription.isPaid && (
          <div>
            <h4 className="mb-3 font-medium">Premium Features:</h4>
            <div className="flex flex-wrap gap-2">
              {plan.features.aiContentGeneration && (
                <Badge variant="secondary">
                  <Icon className="mr-1" icon={SparklesIcon} size={12} />
                  AI Generation
                </Badge>
              )}
              {plan.features.analytics && (
                <Badge variant="secondary">Analytics</Badge>
              )}
              {plan.features.collaboration && (
                <Badge variant="secondary">Collaboration</Badge>
              )}
              {plan.features.advancedScheduling && (
                <Badge variant="secondary">Advanced Scheduling</Badge>
              )}
              {plan.features.bulkUpload && (
                <Badge variant="secondary">Bulk Upload</Badge>
              )}
              {plan.features.prioritySupport && (
                <Badge variant="secondary">Priority Support</Badge>
              )}
              {plan.features.whiteLabel && (
                <Badge variant="secondary">White Label</Badge>
              )}
              {plan.features.customBranding && (
                <Badge variant="secondary">Custom Branding</Badge>
              )}
            </div>
          </div>
        )}

        {/* Cancellation notice */}
        {subscription.cancelAtPeriodEnd && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
            <p className="font-medium text-destructive text-sm">
              Your subscription will end on{" "}
              {subscription.currentPeriodEnd &&
                format(subscription.currentPeriodEnd, "MMMM dd, yyyy")}
            </p>
            <p className="mt-1 text-muted-foreground text-sm">
              You'll have access to all features until then.
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {subscription.isFree ? (
          <Button
            className="w-full"
            onClick={() => {
              window.location.href = "/billing";
            }}
            size="lg"
          >
            <Icon className="mr-2" icon={SparklesIcon} size={16} />
            Upgrade Plan
          </Button>
        ) : (
          <>
            <Button
              className="flex-1"
              disabled={isLoadingPortal}
              onClick={handleManageSubscription}
              variant="outline"
            >
              <Icon className="mr-2" icon={CreditCardIcon} size={16} />
              {isLoadingPortal ? "Loading..." : "Billing Portal"}
            </Button>
            {!subscription.cancelAtPeriodEnd && (
              <Button
                className="flex-1"
                onClick={() => {
                  window.location.href = "/billing";
                }}
                variant="outline"
              >
                Change Plan
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}
