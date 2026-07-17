"use client";

import { useEffect, useState } from "react";
import { FeatureGate } from "@/components/feature-gate";
import { OperationsError } from "@/components/operations/query-state";
import { useApiClient } from "@/components/providers/api-client";
import { useOperationsWorkspace } from "@/hooks/use-operations-workspace";
import { useResourceAtom } from "@/state/resources";
import { AnalyticsContent } from "./analytics-content";

export function AnalyticsClient() {
  const { resources } = useApiClient();
  const workspace = useOperationsWorkspace();
  const workspaceId = workspace.workspaceId ?? "";
  const accountOptions = resources.connections.list(workspaceId, {
    limit: 100,
    offset: 0,
  });
  const accounts = useResourceAtom({
    ...accountOptions,
    queryKey: accountOptions.queryKey!,
    enabled: !!workspace.workspaceId,
  });
  const instagramAccounts =
    accounts.data?.data.filter(
      (account) => account.platform.toLowerCase() === "instagram"
    ) ?? [];
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!selectedProviderId && instagramAccounts[0]) {
      setSelectedProviderId(instagramAccounts[0].id);
    }
  }, [instagramAccounts, selectedProviderId]);

  const insightOptions = resources.analytics.insights(
    workspaceId,
    selectedProviderId,
    { windowDays: days }
  );
  const insights = useResourceAtom({
    ...insightOptions,
    queryKey: insightOptions.queryKey!,
    enabled: !!workspace.workspaceId && !!selectedProviderId,
  });

  if (workspace.error || accounts.error) {
    const error = workspace.error ?? accounts.error;
    return (
      <OperationsError
        error={error!}
        onRetry={async () => {
          await (workspace.error ? workspace.retry() : accounts.refetch());
        }}
      />
    );
  }

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
        accounts={instagramAccounts}
        days={days}
        error={insights.error}
        insights={insights.data ?? null}
        isLoading={
          workspace.isLoading ||
          accounts.isPending ||
          (!!selectedProviderId && insights.isPending)
        }
        isRefreshing={insights.isFetching}
        onChangeDays={setDays}
        onSelectProvider={setSelectedProviderId}
        onSync={async () => {
          await insights.refetch();
        }}
        selectedProviderId={selectedProviderId}
      />
    </FeatureGate>
  );
}
