"use client";

import { Badge } from "@delulu/design-system/components/ui/badge";
import { Button } from "@delulu/design-system/components/ui/button";
import { Icon } from "@delulu/design-system/providers/icon";
import { CheckmarkCircle01Icon, RefreshIcon } from "@delulu/icons";
import { PricingCards } from "@/components/billing/pricing-cards";

export function PlanStep({
  isRefreshing,
  onRefresh,
  paid,
  plan,
  refreshError,
  connectionUpgrade = false,
  onDashboard,
}: {
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
  paid: boolean;
  plan: string;
  refreshError: string | null;
  connectionUpgrade?: boolean;
  onDashboard: () => Promise<void>;
}) {
  const community = plan.toUpperCase() === "COMMUNITY";
  const checkoutReturnUrl = connectionUpgrade
    ? "/onboarding?step=plan&source=connection-limit"
    : "/onboarding?step=plan";
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant={paid ? "default" : "secondary"}>
          {paid ? "Plan active" : "Required final step"}
        </Badge>
        <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">
          {paid ? "Your plan is active" : "Choose the plan that fits your work"}
        </h1>
        <p className="max-w-2xl text-muted-foreground leading-relaxed">
          {paid
            ? connectionUpgrade
              ? `${plan} is active, but its account limit is reached. Upgrade to add the account you need.`
              : `${plan} is active for this workspace. You can now finish onboarding.`
            : "Select a plan and complete checkout to activate publishing and automations. You’ll return here automatically."}
        </p>
      </div>

      {paid ? (
        <div className="space-y-3">
          <output
            aria-live="polite"
            className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4"
          >
            <Icon
              className="shrink-0 text-emerald-600"
              icon={CheckmarkCircle01Icon}
              size={24}
            />
            <div>
              <p className="font-medium">
                {community ? "Community access confirmed" : "Payment confirmed"}
              </p>
              <p className="text-muted-foreground text-sm">
                {community
                  ? "This deployment does not require external checkout."
                  : connectionUpgrade
                    ? "Choose a higher plan below, or return to connections to replace an account."
                    : "Continue to enter your workspace."}
              </p>
            </div>
          </output>
          {connectionUpgrade ? null : (
            <Button className="min-h-11" onClick={onDashboard} variant="ghost">
              Go to dashboard
            </Button>
          )}
          {connectionUpgrade && !community ? (
            <PricingCards checkoutReturnUrl={checkoutReturnUrl} />
          ) : null}
        </div>
      ) : isRefreshing ? (
        <output
          aria-live="polite"
          className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4"
        >
          <span className="size-2 animate-pulse rounded-full bg-primary motion-reduce:animate-none" />
          <div>
            <p className="font-medium">Payment confirmed, syncing…</p>
            <p className="text-muted-foreground text-sm">
              We’re activating your plan. Keep this page open.
            </p>
          </div>
        </output>
      ) : (
        <PricingCards checkoutReturnUrl={checkoutReturnUrl} />
      )}

      {refreshError ? (
        <div
          className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <p className="text-sm">{refreshError}</p>
          <Button
            className="min-h-11"
            disabled={isRefreshing}
            onClick={onRefresh}
            variant="outline"
          >
            <Icon icon={RefreshIcon} size={16} />
            Refresh plan status
          </Button>
        </div>
      ) : null}
    </div>
  );
}
