"use client";

import { SOCIAL_ACCOUNT_DISCONNECTED } from "@delulu/analytics/events";
import { useAnalytics } from "@delulu/analytics/posthog/client";
import { Badge } from "@delulu/design-system/components/ui/badge";
import { Button } from "@delulu/design-system/components/ui/button";
import { Card, CardContent } from "@delulu/design-system/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApiClient } from "@/components/providers/api-client";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { AccountFilters } from "./account-filter";
import { AccountStats } from "./account-stats";
import { ConnectedAccountsHeader } from "./connect-account-header";

export default function ConnectedAccounts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const analytics = useAnalytics();
  const queryClient = useQueryClient();
  const { workspaceId, isPending: isWorkspacePending } = useActiveWorkspace();
  const { resources } = useApiClient();
  const accounts = useQuery({
    ...resources.connections.list(workspaceId ?? "", { limit: 100 }),
    enabled: Boolean(workspaceId),
    staleTime: 30_000,
    retry: 2,
  });
  const removeConnection = useMutation({
    ...resources.connections.remove(workspaceId ?? ""),
    onSuccess: async () => {
      if (!workspaceId) return;
      await queryClient.invalidateQueries({
        queryKey: resources.connections.list(workspaceId).queryKey,
      });
    },
  });

  const filteredAccounts = useMemo(
    () =>
      (accounts.data?.data ?? []).filter((account) => {
        const search = searchQuery.toLowerCase();
        const matchesSearch =
          (account.displayName ?? "").toLowerCase().includes(search) ||
          (account.username ?? "").toLowerCase().includes(search);
        const matchesPlatform =
          filterPlatform === "all" ||
          account.platform.toUpperCase() === filterPlatform;
        const expired = account.expiresAt
          ? new Date(account.expiresAt).getTime() <= Date.now()
          : false;
        const expiring = account.expiresAt
          ? new Date(account.expiresAt).getTime() - Date.now() <=
              7 * 86_400_000 && !expired
          : false;
        const matchesStatus =
          filterStatus === "all" ||
          (filterStatus === "active" && !expired) ||
          (filterStatus === "expired" && expired) ||
          (filterStatus === "expiring" && expiring);
        return matchesSearch && matchesPlatform && matchesStatus;
      }),
    [accounts.data, filterPlatform, filterStatus, searchQuery],
  );

  const stats = useMemo(() => {
    const now = Date.now();
    const values = accounts.data?.data ?? [];
    const expired = values.filter(
      (item) => item.expiresAt && new Date(item.expiresAt).getTime() <= now,
    ).length;
    const expiring = values.filter(
      (item) =>
        item.expiresAt &&
        new Date(item.expiresAt).getTime() > now &&
        new Date(item.expiresAt).getTime() - now <= 7 * 86_400_000,
    ).length;
    return {
      total: values.length,
      active: values.length - expired,
      expired,
      expiring,
    };
  }, [accounts.data]);

  const handleDelete = async (id: string) => {
    try {
      await removeConnection.mutateAsync(id);
      analytics.capture(SOCIAL_ACCOUNT_DISCONNECTED, {
        provider:
          accounts.data?.data
            .find((item) => item.id === id)
            ?.platform.toLowerCase() ?? "unknown",
      });
      toast.success("Account disconnected");
    } catch (error) {
      toast.error("Failed to disconnect account", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  if (isWorkspacePending || accounts.isPending)
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading accounts...
      </div>
    );
  if (accounts.isError || !workspaceId)
    return (
      <div className="m-6 rounded-lg border border-destructive/40 p-4 text-destructive">
        <p>
          {accounts.error?.message ??
            "Select a workspace to manage connections."}
        </p>
        <Button
          className="mt-3"
          onClick={() => accounts.refetch()}
          variant="outline"
        >
          Retry
        </Button>
      </div>
    );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="mx-auto flex max-w-6xl flex-col space-y-3 p-4 md:space-y-6 md:p-0">
        <ConnectedAccountsHeader />
        <AccountStats stats={stats} />
        <AccountFilters
          filterPlatform={filterPlatform}
          filterStatus={filterStatus}
          searchQuery={searchQuery}
          setFilterPlatform={setFilterPlatform}
          setFilterStatus={setFilterStatus}
          setSearchQuery={setSearchQuery}
          setViewMode={setViewMode}
          viewMode={viewMode}
        />
        {filteredAccounts.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            No accounts found.
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                : "divide-y rounded-lg border"
            }
          >
            {filteredAccounts.map((account) => (
              <Card
                className={viewMode === "list" ? "rounded-none border-0" : ""}
                key={account.id}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">
                        {account.displayName ??
                          account.username ??
                          account.profileId}
                      </p>
                      <Badge variant="secondary">{account.platform}</Badge>
                    </div>
                    <p className="truncate text-muted-foreground text-xs">
                      {account.username
                        ? `@${account.username}`
                        : account.profileId}
                      {account.expiresAt
                        ? ` · expires ${new Date(account.expiresAt).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <Button
                    disabled={removeConnection.isPending}
                    onClick={() => handleDelete(account.id)}
                    size="sm"
                    variant="destructive"
                  >
                    Disconnect
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
