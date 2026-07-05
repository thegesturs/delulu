"use client";

import { api } from "@delulu/database/convex/_generated/api";
import { Button } from "@delulu/design-system/components/ui/button";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  Add,
  ArrowRight01Icon,
  MailSend01Icon,
} from "@hugeicons-pro/core-solid-rounded";
import { useQuery } from "convex-helpers/react/cache";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardStatsClient } from "@/components/dashboard/dashboard-stats";
import { PendingReviews } from "@/components/dashboard/pending-reviews";
import { PlatformHealthAlert } from "@/components/dashboard/platform-health-alert";
import { UpcomingSchedule } from "@/components/dashboard/upcoming-schedule";
import { DmSummaryCard } from "@/components/dashboard/dm-summary-card";
import type { DashboardStats, UpcomingPost } from "@/types/convex";
import { Header } from "../layout/header";

interface DashboardContentProps {
  dashboardStats: DashboardStats | null;
  upcomingPosts: UpcomingPost[] | null;
  isLoading: boolean;
}

export function DashboardContent({
  dashboardStats,
  upcomingPosts,
  isLoading,
}: DashboardContentProps) {
  const router = useRouter();
  const automations = useQuery(api.automations.getAutomations, {});
  const hasAutomations = automations && automations.length > 0;

  return (
    <div className="space-y-4 overflow-auto p-4 md:p-8">
      <Header page="Overview" pages={["Dashboard"]}>
        <Button onClick={() => router.push("/post")}>
          <Icon className="mr-2" icon={Add} size={16} />
          Create Post
        </Button>
      </Header>

      <DmSummaryCard />

      {/* Pending Reviews — shown prominently for admins, and for editors/members with submissions */}
      <PendingReviews />

      {/* Alerts Section */}
      <PlatformHealthAlert expiredTokens={dashboardStats?.expiredTokens || 0} />

      {/* Quick Actions */}
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
                {automations.filter((a) => a.isActive).length}/
                {automations.length}
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

      {/* Main Stats */}
      <DashboardStatsClient
        isLoading={isLoading}
        stats={
          dashboardStats ?? {
            totalPosts: 0,
            publishedCount: 0,
            scheduledCount: 0,
            failedCount: 0,
            savedCount: 0,
            processingCount: 0,
            upcomingPosts: 0,
            thisWeekPosts: 0,
            lastWeekPosts: 0,
            successRate: 0,
            connectedAccounts: 0,
            expiredTokens: 0,
            postingStreak: 0,
            longestStreak: 0,
          }
        }
      />

      {/* Schedule Section */}
      <UpcomingSchedule upcomingPosts={upcomingPosts ?? []} />
    </div>
  );
}
