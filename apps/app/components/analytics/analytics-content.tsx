"use client";

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
import type {
  AccountOverview,
  MediaInsight,
  SocialProvider,
} from "@/types/convex";
import { AnalyticsStatCards } from "./analytics-stat-cards";
import { EngagementChart } from "./engagement-chart";
import { TopPostsList } from "./top-posts-list";

interface AnalyticsContentProps {
  accounts: SocialProvider[];
  selectedProviderId: string;
  onSelectProvider: (id: string) => void;
  days: number;
  onChangeDays: (days: number) => void;
  overview: AccountOverview | null;
  topPosts: MediaInsight[];
  isLoading: boolean;
  onSync: () => void;
}

function formatSyncTime(timestamp: number | undefined): string {
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
  overview,
  topPosts,
  isLoading,
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

  const isSyncing = overview?.syncStatus === "SYNCING";

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
                  <SelectItem key={account._id} value={account._id}>
                    @{account.username || account.fullName}
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
              {formatSyncTime(overview?.lastSyncedAt)}
            </span>
            {overview?.syncStatus === "ERROR" && (
              <Badge className="text-xs" variant="destructive">
                Sync error
              </Badge>
            )}
            {overview?.syncStatus === "TOKEN_EXPIRED" && (
              <Badge className="text-xs" variant="destructive">
                Token expired
              </Badge>
            )}
            <Button
              disabled={isSyncing || !selectedProviderId}
              onClick={onSync}
              size="sm"
              variant="outline"
            >
              <Icon
                className={isSyncing ? "animate-spin" : ""}
                icon={
                  isSyncing ? Loading03Icon : ArrowDataTransferHorizontalIcon
                }
                size={14}
              />
              {isSyncing ? "Syncing..." : "Sync"}
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <AnalyticsStatCards
          currentTotals={overview?.currentTotals}
          isLoading={isLoading}
          postsTracked={topPosts.length}
          prevTotals={overview?.prevTotals}
        />

        {/* Engagement chart */}
        <EngagementChart
          insights={overview?.insights ?? []}
          isLoading={isLoading}
        />

        {/* Top posts */}
        <TopPostsList isLoading={isLoading} posts={topPosts} />
      </div>
    </div>
  );
}
