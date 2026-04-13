"use client";

import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import { useQuery } from "convex-helpers/react/cache";
import { useEffect, useRef, useState } from "react";
import { FeatureGate } from "@/components/feature-gate";
import { api as trpcApi } from "@/trpc/react";
import { AnalyticsContent } from "./analytics-content";

export function AnalyticsClient() {
  const accounts = useQuery(api.social_providers.getConnectedAccounts);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [days, setDays] = useState<number>(30);

  // Auto-select first Instagram account
  const instagramAccounts = accounts?.filter(
    (a) => a.socialType === "INSTAGRAM"
  );

  useEffect(() => {
    if (
      !selectedProviderId &&
      instagramAccounts &&
      instagramAccounts.length > 0
    ) {
      setSelectedProviderId(instagramAccounts[0]._id);
    }
  }, [instagramAccounts, selectedProviderId]);

  // Fetch analytics data for selected account (Convex — reactive)
  const overview = useQuery(
    api.analytics.getAccountOverview,
    selectedProviderId
      ? {
          socialProviderId: selectedProviderId as Id<"socialProviders">,
          days,
        }
      : "skip"
  );

  const topPosts = useQuery(
    api.analytics.getTopPosts,
    selectedProviderId
      ? {
          socialProviderId: selectedProviderId as Id<"socialProviders">,
          sortBy: "views",
          limit: 25,
        }
      : "skip"
  );

  // Sync via tRPC (runs on Cloudflare Workers, not Convex)
  const triggerSync = trpcApi.analytics.triggerSync.useMutation();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (
      overview?.isStale &&
      overview.syncStatus !== "SYNCING" &&
      selectedProviderId &&
      !hasSynced.current &&
      !triggerSync.isPending
    ) {
      hasSynced.current = true;
      triggerSync.mutate({
        socialProviderId: selectedProviderId,
      });
    }
  }, [overview, selectedProviderId, triggerSync]);

  // Reset sync flag when account changes
  useEffect(() => {
    hasSynced.current = false;
  }, [selectedProviderId]);

  const handleManualSync = () => {
    if (selectedProviderId && !triggerSync.isPending) {
      triggerSync.mutate({
        socialProviderId: selectedProviderId,
      });
    }
  };

  return (
    <FeatureGate
      fallback={
        <div className="flex h-screen items-center justify-center">
          <p className="text-muted-foreground">Page not found</p>
        </div>
      }
      flag="analytics"
    >
      <AnalyticsContent
        accounts={instagramAccounts ?? []}
        days={days}
        isLoading={overview === undefined && !!selectedProviderId}
        onChangeDays={setDays}
        onSelectProvider={setSelectedProviderId}
        onSync={handleManualSync}
        overview={overview ?? null}
        selectedProviderId={selectedProviderId}
        topPosts={topPosts ?? []}
      />
    </FeatureGate>
  );
}
