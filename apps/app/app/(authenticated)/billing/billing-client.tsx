"use client";

/**
 * Billing Client Component
 *
 * Comprehensive billing dashboard showing:
 * - Current subscription plan
 * - Usage statistics
 * - Pricing options for upgrades
 * - Billing management
 */

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@delulu/design-system/components/ui/alert";
import { Icon } from "@delulu/design-system/providers/icon";
import type { PlanType } from "@delulu/payments";
import { getProductIds } from "@delulu/payments/product-ids";
import { TickDouble01Icon } from "@hugeicons-pro/core-solid-rounded";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { CurrentPlanCard } from "@/components/billing/current-plan-card";
import { PricingCards } from "@/components/billing/pricing-cards";
import { UsageStats } from "@/components/billing/usage-stats";
import { useCurrency } from "@/hooks/use-currency";

export default function BillingClient() {
  const currency = useCurrency();
  const productIds = getProductIds(currency);
  const PRODUCT_IDS: Record<PlanType, { monthly: string; yearly: string }> = {
    FREE: { monthly: "", yearly: "" },
    VIBE: productIds.VIBE,
    ECHO: productIds.ECHO,
  };
  const searchParams = useSearchParams();
  const status = searchParams?.get("status"); // Dodo Payments returns 'status' param
  const subscriptionId = searchParams?.get("subscription_id");
  const cancelled = searchParams?.get("cancelled");

  // Show success/error messages from checkout redirects
  useEffect(() => {
    if (status === "succeeded" || status === "active") {
      toast.success("Subscription updated successfully!", {
        description:
          "Your payment has been processed. Welcome to your new plan!",
      });
    } else if (status === "failed") {
      toast.error("Payment failed", {
        description: "Your payment could not be processed. Please try again.",
      });
    } else if (cancelled === "true") {
      toast.error("Checkout cancelled", {
        description: "You can upgrade anytime from this page.",
      });
    }
  }, [status, cancelled]);

  return (
    <div className="container mx-auto h-full max-w-7xl space-y-8 overflow-y-auto px-2 py-8">
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
      {(status === "succeeded" || status === "active") && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <Icon className="text-green-500" icon={TickDouble01Icon} size={16} />
          <AlertTitle>Subscription Updated!</AlertTitle>
          <AlertDescription>
            Your payment has been processed successfully. You now have access to
            all premium features.
            {subscriptionId && (
              <span className="mt-1 block text-muted-foreground text-xs">
                Subscription ID: {subscriptionId}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {status === "failed" && (
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertTitle>Payment Failed</AlertTitle>
          <AlertDescription>
            Your payment could not be processed. Please try again or contact
            support.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan & Usage - Top Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CurrentPlanCard />
        <UsageStats />
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Available Plans
          </span>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="space-y-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-2 font-bold text-2xl">Choose Your Perfect Plan</h2>
          <p className="text-muted-foreground">
            Start free and upgrade anytime. All paid plans include a 14-day
            money-back guarantee.
          </p>
        </div>

        <PricingCards
          onUpgradeSuccess={() => {
            toast.success("Redirecting to checkout...");
          }}
          productIds={PRODUCT_IDS}
        />
      </div>

      {/* FAQ Section */}
      <div className="mx-auto mt-12 max-w-3xl space-y-6">
        <h3 className="font-semibold text-xl">Frequently Asked Questions</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h4 className="mb-2 font-medium">Can I change plans later?</h4>
            <p className="text-muted-foreground text-sm">
              Yes! You can upgrade or downgrade your plan at any time. Changes
              take effect immediately for upgrades.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h4 className="mb-2 font-medium">
              What payment methods do you accept?
            </h4>
            <p className="text-muted-foreground text-sm">
              We accept all major credit cards through our secure payment
              processor, Dodo Payments.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h4 className="mb-2 font-medium">Is there a refund policy?</h4>
            <p className="text-muted-foreground text-sm">
              Yes! All paid plans come with a 14-day money-back guarantee.
              Contact support for a full refund.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h4 className="mb-2 font-medium">Can I cancel anytime?</h4>
            <p className="text-muted-foreground text-sm">
              Absolutely. Cancel anytime and retain access until the end of your
              billing period.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
