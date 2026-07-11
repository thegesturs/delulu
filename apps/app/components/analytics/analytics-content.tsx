"use client";

import type { createAnalyticsOptions } from "@delulu/client";
import { Badge } from "@delulu/design-system/components/ui/badge";
import { Button } from "@delulu/design-system/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@delulu/design-system/components/ui/select";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  Analytics01Icon,
  ArrowDataTransferHorizontalIcon,
  Loading03Icon,
} from "@hugeicons-pro/core-solid-rounded";
import { Header } from "@/components/layout/header";
import { OperationsError } from "@/components/operations/query-state";
import { AnalyticsStatCards } from "./analytics-stat-cards";
import { EngagementChart } from "./engagement-chart";
import { TopPostsList } from "./top-posts-list";

type AnalyticsOptions = ReturnType<typeof createAnalyticsOptions>;
type InsightQuery = ReturnType<AnalyticsOptions["insights"]>;
type InsightQueryFunction = Extract<
  InsightQuery["queryFn"],
  (...args: never[]) => unknown
>;
type Insights = Awaited<ReturnType<InsightQueryFunction>>;
export type InsightPoint = Insights["current"]["points"][number];
export type InsightPost = Insights["topPosts"][number];

interface AnalyticsContentProps {
  accounts: readonly {
    id: string;
    username: string | null;
    displayName: string | null;
  }[];
  selectedProviderId: string;
  onSelectProvider: (id: string) => void;
  days: number;
  onChangeDays: (days: number) => void;
  insights: Insights | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  onSync: () => void;
}

function formatSyncTime(timestamp: string | undefined): string {
  if (!timestamp) {
    return "Never synced";
  }
  return `Synced ${new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}`;
}

export function AnalyticsContent({
  accounts,
  selectedProviderId,
  onSelectProvider,
  days,
  onChangeDays,
  insights,
  isLoading,
  isRefreshing,
  error,
  onSync,
}: AnalyticsContentProps) {
  // No accounts connected
  if (accounts.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header page="Analytics" pages={[]} />
        <div className="mx-auto max-w-6xl p-4 md:p-6">
          <div className="flex flex-col items-center justify-center py-24">
            <div className="mb-4 rounded-full bg-muted/50 p-4">
              <Icon
                className="text-muted-foreground"
                icon={Analytics01Icon}
                size={32}
              />
            </div>
            <h2 className="mb-2 font-semibold text-lg">
              No accounts connected
            </h2>
            <p className="text-center text-muted-foreground text-sm">
              Connect an Instagram account to start tracking analytics
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !insights) {
    return <OperationsError error={error} onRetry={onSync} />;
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-background pb-20 md:pb-0">
      <Header page="Analytics" pages={[]} />
      <div className="mx-auto max-w-6xl space-y-4 p-4 md:space-y-6 md:p-6">
        {/* Controls row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {/* Account selector */}
            <Select onValueChange={onSelectProvider} value={selectedProviderId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    @{account.username || account.displayName || "account"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Period selector */}
            <Select
              onValueChange={(v) => onChangeDays(Number(v))}
              value={String(days)}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sync status */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
              {formatSyncTime(insights?.cachedAt)}
            </span>
            {(insights?.stale || error) && (
              <Badge className="text-xs" variant="secondary">
                Cached data
              </Badge>
            )}
            <Button
              disabled={isRefreshing || !selectedProviderId}
              onClick={onSync}
              size="sm"
              variant="outline"
            >
              <Icon
                className={isRefreshing ? "animate-spin" : ""}
                icon={
                  isRefreshing ? Loading03Icon : ArrowDataTransferHorizontalIcon
                }
                size={14}
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <AnalyticsStatCards
          currentTotals={insights?.current.totals}
          isLoading={isLoading}
          percentageChange={insights?.percentageChange}
          postsTracked={insights?.topPosts.length ?? 0}
        />

        {/* Engagement chart */}
        <EngagementChart
          insights={insights?.current.points ?? []}
          isLoading={isLoading}
        />

        {/* Top posts */}
        <TopPostsList isLoading={isLoading} posts={insights?.topPosts ?? []} />
      </div>
    </div>
  );
}
