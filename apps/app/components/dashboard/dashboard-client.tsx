"use client";

import { OperationsError } from "@/components/operations/query-state";
import { useApiClient } from "@/components/providers/api-client";
import { useOperationsWorkspace } from "@/hooks/use-operations-workspace";
import { useResourceAtom } from "@/state/resources";
import { DashboardContent } from "./dashboard-content";

export function DashboardClient() {
  const { resources } = useApiClient();
  const workspace = useOperationsWorkspace();
  const options = resources.analytics.operational(workspace.workspaceId ?? "");
  const stats = useResourceAtom({
    ...options,
    queryKey: options.queryKey!,
    enabled: !!workspace.workspaceId,
  });

  const error = workspace.error ?? stats.error;
  if (error) {
    return (
      <OperationsError
        error={error}
        onRetry={async () => {
          await (workspace.error ? workspace.retry() : stats.refetch());
        }}
      />
    );
  }

  return (
    <DashboardContent
      dashboardStats={stats.data ?? null}
      isLoading={workspace.isLoading || stats.isPending}
    />
  );
}
