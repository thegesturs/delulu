"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  Add,
  ArrowRight01Icon,
  MailSend01Icon,
} from "@hugeicons-pro/core-solid-rounded";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardStatsClient } from "@/components/dashboard/dashboard-stats";
import { DmSummaryCard } from "@/components/dashboard/dm-summary-card";
import { FailedPostsAlert } from "@/components/dashboard/failed-posts-alert";
import { PendingReviews } from "@/components/dashboard/pending-reviews";
import { PlatformHealthAlert } from "@/components/dashboard/platform-health-alert";
import { useApiClient } from "@/components/providers/api-client";
import { useOperationsWorkspace } from "@/hooks/use-operations-workspace";
import { Header } from "../layout/header";

interface OperationalStats {
  readonly counts: {
    readonly totalPosts: number;
    readonly published: number;
    readonly scheduled: number;
    readonly failed: number;
    readonly partiallyFailed: number;
    readonly scheduledNextSevenDays: number;
  };
  readonly streak: {
    readonly currentDays: number;
    readonly longestDays: number;
  };
}

export function DashboardContent({
  dashboardStats,
  isLoading,
}: {
  dashboardStats: OperationalStats | null;
  isLoading: boolean;
}) {
  const router = useRouter();
  const { resources } = useApiClient();
  const workspace = useOperationsWorkspace();
  const scope = workspace.workspaceId
    ? {
        workspaceId: workspace.workspaceId,
        platform: "instagram" as const,
        category: "dm",
      }
    : undefined;
  const options = resources.automations.list(
    scope ?? { workspaceId: "", platform: "instagram", category: "dm" },
    { limit: 100, offset: 0 }
  );
  const automations = useQuery({
    ...options,
    queryKey: options.queryKey!,
    enabled: !!scope,
  });
  const automationItems = automations.data?.data ?? [];
  const hasAutomations = automationItems.length > 0;
  const counts = dashboardStats?.counts;

  return (
    <div className="space-y-4 overflow-auto p-4 md:p-8">
      <Header page="Overview" pages={["Dashboard"]}>
        <Button onClick={() => router.push("/post")}>
          <Icon className="mr-2" icon={Add} size={16} />
          Create Post
        </Button>
      </Header>
      <DmSummaryCard />
      <PendingReviews />
      <FailedPostsAlert />
      <PlatformHealthAlert expiredTokens={0} />
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link className="block" href="/automations/new">
          <div className="flex items-center gap-2 rounded-lg border px-4 py-2.5 font-medium text-sm transition-colors hover:bg-muted/50">
            <Icon className="text-primary" icon={MailSend01Icon} size={16} />
            <span className="flex-1">
              {hasAutomations ? "New DM Automation" : "Set up DM Automation"}
            </span>
            <Icon
              className="text-muted-foreground"
              icon={ArrowRight01Icon}
              size={14}
            />
          </div>
        </Link>
        {hasAutomations && (
          <Link className="block" href="/automations">
            <div className="flex items-center gap-2 rounded-lg border px-4 py-2.5 font-medium text-sm transition-colors hover:bg-muted/50">
              <span className="flex-1">Automations</span>
              <span className="text-muted-foreground text-xs">
                {
                  automationItems.filter((automation) => automation.enabled)
                    .length
                }
                /{automationItems.length}
              </span>
              <Icon
                className="text-muted-foreground"
                icon={ArrowRight01Icon}
                size={14}
              />
            </div>
          </Link>
        )}
      </div>
      <DashboardStatsClient
        isLoading={isLoading}
        stats={{
          totalPosts: counts?.totalPosts ?? 0,
          publishedPosts: counts?.published ?? 0,
          scheduledPosts: counts?.scheduled ?? 0,
          failedPosts: (counts?.failed ?? 0) + (counts?.partiallyFailed ?? 0),
          totalSocialAccounts: 0,
          totalAutomations: automationItems.length,
          publishedCount: counts?.published ?? 0,
          scheduledCount: counts?.scheduled ?? 0,
          failedCount: (counts?.failed ?? 0) + (counts?.partiallyFailed ?? 0),
          savedCount: 0,
          processingCount: 0,
          upcomingPosts: counts?.scheduledNextSevenDays ?? 0,
          connectedAccounts: 0,
          expiredTokens: 0,
          postingStreak: dashboardStats?.streak.currentDays ?? 0,
          longestStreak: dashboardStats?.streak.longestDays ?? 0,
        }}
      />
    </div>
  );
}
