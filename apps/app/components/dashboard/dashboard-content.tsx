'use client';

import { DashboardStatsClient } from '@/components/dashboard/dashboard-stats';
import { PlatformHealthAlert } from '@/components/dashboard/platform-health-alert';
import { UpcomingSchedule } from '@/components/dashboard/upcoming-schedule';
import type { DashboardStats, UpcomingPost } from '@/types/convex';
import { Button } from '@delulu/design-system/components/ui/button';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Header } from '../layout/header';

type DashboardContentProps = {
  dashboardStats: DashboardStats | null;
  upcomingPosts: UpcomingPost[] | null;
  isLoading: boolean;
};

export function DashboardContent({
  dashboardStats,
  upcomingPosts,
  isLoading,
}: DashboardContentProps) {
  const router = useRouter();

  return (
    <div className="space-y-2 overflow-auto p-8">
      <Header pages={['Dashboard']} page="Overview">
        <Button onClick={() => router.push('/post')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Post
        </Button>
      </Header>

      {/* Alerts Section - Critical information first */}
      <div className="space-y-2">
        <PlatformHealthAlert
          expiredTokens={dashboardStats?.expiredTokens || 0}
        />
      </div>

      {/* Main Stats - Core metrics */}
      <DashboardStatsClient
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
        isLoading={isLoading}
      />

      {/* Schedule Section - Full width for better visibility */}
      <UpcomingSchedule upcomingPosts={upcomingPosts ?? []} />
    </div>
  );
}
