"use client";

import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import { useEffect, useRef, useState } from "react";
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

  // Fetch analytics data for selected account
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

  // Auto-trigger sync when data is stale
  const triggerSync = useMutation(api.analytics.triggerSync);
  const hasSynced = useRef(false);

  useEffect(() => {
    if (
      overview?.isStale &&
      overview.syncStatus !== "SYNCING" &&
      selectedProviderId &&
      !hasSynced.current
    ) {
      hasSynced.current = true;
      triggerSync({
        socialProviderId: selectedProviderId as Id<"socialProviders">,
      });
    }
  }, [overview, selectedProviderId, triggerSync]);

  // Reset sync flag when account changes
  useEffect(() => {
    hasSynced.current = false;
  }, [selectedProviderId]);

  const handleManualSync = () => {
    if (selectedProviderId) {
      triggerSync({
        socialProviderId: selectedProviderId as Id<"socialProviders">,
      });
    }
  };

  return (
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
  );
}
