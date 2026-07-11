"use client";

import { Badge } from "@delulu/design-system/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@delulu/design-system/components/ui/card";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  Calendar01Icon,
  CancelCircleIcon,
  ClockIcon,
  DocumentAttachmentIcon,
  FireIcon,
  TickDouble01Icon,
  UserMultipleIcon,
} from "@hugeicons-pro/core-solid-rounded";
import { useQuery } from "@tanstack/react-query";
import { OperationsError } from "@/components/operations/query-state";
import { useApiClient } from "@/components/providers/api-client";
import { useOperationsWorkspace } from "@/hooks/use-operations-workspace";
import type { DashboardStats } from "@/types/convex";

interface DashboardStatsClientProps {
  stats: DashboardStats;
  isLoading: boolean;
}

export function DashboardStatsClient({
  stats: legacyStats,
  isLoading: legacyLoading,
}: DashboardStatsClientProps) {
  const { resources } = useApiClient();
  const workspace = useOperationsWorkspace();
  const options = resources.analytics.operational(workspace.workspaceId ?? "");
  const query = useQuery({
    ...options,
    queryKey: options.queryKey!,
    enabled: !!workspace.workspaceId,
  });
  const isLoading = workspace.isLoading || query.isPending || legacyLoading;
  const stats = query.data
    ? {
        ...legacyStats,
        totalPosts: query.data.counts.totalPosts,
        publishedCount: query.data.counts.published,
        scheduledCount: query.data.counts.scheduled,
        failedCount:
          query.data.counts.failed + query.data.counts.partiallyFailed,
        upcomingPosts: query.data.counts.scheduledNextSevenDays,
        postingStreak: query.data.streak.currentDays,
        longestStreak: query.data.streak.longestDays,
      }
    : legacyStats;

  if (workspace.error || query.error) {
    return (
      <OperationsError
        error={(workspace.error ?? query.error)!}
        onRetry={async () => {
          await (workspace.error ? workspace.retry() : query.refetch());
        }}
      />
    );
  }
  const v = (n: number) => (isLoading ? "..." : n);

  return (
    <>
      {/* Mobile: compact 2-column grid */}
      <div className="grid grid-cols-2 gap-2 md:hidden">
        {[
          {
            label: "Posts",
            value: v(stats.totalPosts),
            icon: DocumentAttachmentIcon,
            color: "text-muted-foreground",
          },
          {
            label: "Published",
            value: v(stats.publishedCount),
            icon: TickDouble01Icon,
            color: "text-green-600 dark:text-green-400",
          },
          {
            label: "Scheduled",
            value: v(stats.scheduledCount),
            icon: Calendar01Icon,
            color: "text-blue-600 dark:text-blue-400",
          },
          {
            label: "Accounts",
            value: v(stats.connectedAccounts),
            icon: UserMultipleIcon,
            color: "text-muted-foreground",
            extra:
              stats.expiredTokens > 0
                ? `${stats.expiredTokens} expired`
                : undefined,
          },
          {
            label: "Upcoming",
            value: v(stats.upcomingPosts),
            icon: ClockIcon,
            color: "text-blue-600 dark:text-blue-400",
          },
          {
            label: "Streak",
            value: v(stats.postingStreak || 0),
            icon: FireIcon,
            color: stats.postingStreak
              ? "text-orange-500"
              : "text-muted-foreground",
          },
        ].map((item) => (
          <div
            className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5"
            key={item.label}
          >
            <Icon className={item.color} icon={item.icon} size={14} />
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="font-semibold text-sm">{item.value}</span>
                <span className="text-[11px] text-muted-foreground">
                  {item.label}
                </span>
              </div>
              {item.extra && (
                <span className="text-[10px] text-red-500">{item.extra}</span>
              )}
            </div>
          </div>
        ))}
        {stats.failedCount > 0 && (
          <div className="col-span-2 flex items-center gap-2.5 rounded-lg border border-red-200 px-3 py-2.5 dark:border-red-800">
            <Icon className="text-red-500" icon={CancelCircleIcon} size={14} />
            <span className="font-semibold text-red-600 text-sm dark:text-red-400">
              {v(stats.failedCount)}
            </span>
            <span className="text-[11px] text-red-500">Failed</span>
          </div>
        )}
      </div>

      {/* Desktop: full cards */}
      <div className="hidden space-y-2 md:block">
        <div
          className="grid gap-2 md:grid-cols-2 lg:grid-cols-4"
          data-tour="dashboard-stats"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">Total Posts</CardTitle>
              <Icon
                className="text-muted-foreground"
                icon={DocumentAttachmentIcon}
                size={16}
              />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{v(stats.totalPosts)}</div>
              <p className="text-muted-foreground text-xs">All your content</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">Published</CardTitle>
              <Icon
                className="text-green-600 dark:text-green-400"
                icon={TickDouble01Icon}
                size={16}
              />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {v(stats.publishedCount)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Connected Accounts
              </CardTitle>
              <Icon
                className="text-muted-foreground"
                icon={UserMultipleIcon}
                size={16}
              />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {v(stats.connectedAccounts)}
              </div>
              <div className="flex items-center space-x-2 text-xs">
                {stats.expiredTokens > 0 && (
                  <Badge className="text-xs" variant="destructive">
                    {stats.expiredTokens} expired
                  </Badge>
                )}
                {stats.expiredTokens === 0 && !isLoading && (
                  <span className="text-green-600 dark:text-green-400">
                    All active
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Posting Streak
              </CardTitle>
              <Icon
                className={
                  stats.postingStreak && stats.postingStreak > 0
                    ? "text-orange-500 dark:text-orange-400"
                    : "text-muted-foreground"
                }
                icon={FireIcon}
                size={16}
              />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {v(stats.postingStreak || 0)}
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-muted-foreground">
                  {stats.postingStreak === 0
                    ? "Start posting to build streak"
                    : stats.postingStreak === 1
                      ? "day streak"
                      : "days streak"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Upcoming Posts
              </CardTitle>
              <Icon
                className="text-blue-600 dark:text-blue-400"
                icon={ClockIcon}
                size={16}
              />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{v(stats.upcomingPosts)}</div>
              <p className="text-muted-foreground text-xs">
                Scheduled for next 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">Scheduled</CardTitle>
              <Icon
                className="text-blue-600 dark:text-blue-400"
                icon={Calendar01Icon}
                size={16}
              />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {v(stats.scheduledCount)}
              </div>
              <p className="text-muted-foreground text-xs">Ready to publish</p>
            </CardContent>
          </Card>

          {stats.failedCount > 0 && (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-red-800 text-sm dark:text-red-200">
                  Failed Posts
                </CardTitle>
                <Icon
                  className="text-red-600 dark:text-red-400"
                  icon={CancelCircleIcon}
                  size={16}
                />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl text-red-800 dark:text-red-200">
                  {v(stats.failedCount)}
                </div>
                <p className="text-red-600 text-xs dark:text-red-400">
                  Need attention
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
