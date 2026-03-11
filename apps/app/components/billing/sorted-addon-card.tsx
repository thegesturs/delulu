"use client";

import { api } from "@delulu/database/convex/_generated/api";
import { Badge } from "@delulu/design-system/components/ui/badge";
import { Button } from "@delulu/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@delulu/design-system/components/ui/card";
import { Progress } from "@delulu/design-system/components/ui/progress";
import { useAction, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

const SORTED_PRODUCT_ID = "pdt_0NYbkcEzkjqKXheG8mvVT";

export function SortedAddonCard() {
  const usage = useQuery(api.transcriptions.getMyTranscriptionUsage);
  const createCheckout = useAction(api.subscriptions.createCheckoutSession);
  const getPortal = useAction(api.subscriptions.getCustomerPortal);
  const [isLoading, setIsLoading] = useState(false);

  const isSubscribed = usage?.isSubscribed ?? false;
  const used = usage?.used ?? 0;
  const hardLimit = usage?.paidHardLimit ?? 1000;
  const freeLimit = usage?.limit ?? 10;
  const usagePercent = isSubscribed
    ? (used / hardLimit) * 100
    : (used / freeLimit) * 100;

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      const { checkout_url } = await createCheckout({
        productId: SORTED_PRODUCT_ID,
        returnUrl: `${window.location.origin}/billing?status=succeeded`,
      });
      window.location.href = checkout_url;
    } catch (error) {
      console.error("Sorted checkout failed:", error);
      toast.error("Failed to start checkout. Please try again.");
      setIsLoading(false);
    }
  };

  const handleManage = async () => {
    try {
      setIsLoading(true);
      const { portal_url } = await getPortal();
      window.location.href = portal_url;
    } catch (error) {
      console.error("Failed to open portal:", error);
      toast.error("Failed to open billing portal. Please try again.");
      setIsLoading(false);
    }
  };

  if (usage === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sorted Extension</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img
              alt="Sorted"
              className="h-8 w-8 rounded-lg"
              src="/favicon.ico"
            />
            <div>
              <CardTitle className="flex items-center gap-2">
                Sorted Extension
                {isSubscribed && <Badge variant="default">Pro</Badge>}
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Instagram Reel Sorter & Transcriber
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Usage */}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Transcriptions this month
            </span>
            <span className="font-medium">
              {used.toLocaleString()}/
              {isSubscribed ? hardLimit.toLocaleString() : freeLimit}
            </span>
          </div>
          <Progress value={Math.min(usagePercent, 100)} />
          {isSubscribed && used >= 900 && (
            <p className="mt-1 text-muted-foreground text-xs">
              {used >= hardLimit
                ? "Monthly limit reached. Contact support@delulu.social for higher limits."
                : `${(hardLimit - used).toLocaleString()} transcriptions remaining`}
            </p>
          )}
        </div>

        {/* Pricing breakdown */}
        <div className="rounded-lg border p-3 text-sm">
          <h4 className="mb-2 font-medium">
            {isSubscribed ? "Your plan" : "Pro plan — $2/mo"}
          </h4>
          <ul className="space-y-1 text-muted-foreground">
            <li className="flex justify-between">
              <span>Base fee</span>
              <span className="font-medium text-foreground">$2/mo</span>
            </li>
            <li className="flex justify-between">
              <span>Included transcriptions</span>
              <span className="font-medium text-foreground">100/mo</span>
            </li>
            <li className="flex justify-between">
              <span>Overage rate</span>
              <span className="font-medium text-foreground">$0.02 each</span>
            </li>
            <li className="flex justify-between">
              <span>Monthly cap</span>
              <span className="font-medium text-foreground">1,000</span>
            </li>
          </ul>
        </div>

        {!isSubscribed && (
          <p className="text-muted-foreground text-xs">
            Free tier: {freeLimit} transcriptions/month. Upgrade to Pro for up
            to 1,000 transcriptions with metered billing.
          </p>
        )}
      </CardContent>

      <CardFooter>
        {isSubscribed ? (
          <Button
            className="w-full"
            disabled={isLoading}
            onClick={handleManage}
            variant="outline"
          >
            {isLoading ? "Loading..." : "Manage Subscription"}
          </Button>
        ) : (
          <Button
            className="w-full"
            disabled={isLoading}
            onClick={handleSubscribe}
          >
            {isLoading ? "Loading..." : "Subscribe — $2/mo"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
