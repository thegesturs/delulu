'use client';

import { DashboardStatsClient } from '@/components/dashboard/dashboard-stats';
import { PlatformHealthAlert } from '@/components/dashboard/platform-health-alert';
import { UpcomingSchedule } from '@/components/dashboard/upcoming-schedule';
import { api } from '@delulu/database/convex/_generated/api';
import { Button } from '@delulu/design-system/components/ui/button';
import { useQuery } from 'convex/react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/layout/header';

export const dynamic = 'force-dynamic';

function DashboardClient() {
  const router = useRouter();

  // Get dashboard data
  const dashboardStats = useQuery(api.stats.getDashboardStats);
  const recentPosts = useQuery(api.posts.getPosts, {
    paginationOpts: { numItems: 6, cursor: null },
  });
  // const failedPosts = useQuery(api.stats.getFailedPosts);
  const upcomingPosts = useQuery(api.stats.getUpcomingPosts, { days: 7 });

  const isLoading = !dashboardStats || !recentPosts;

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
        {/* <FailedPostsAlert failedPosts={failedPosts || []} /> */}
        <PlatformHealthAlert
          expiredTokens={dashboardStats?.expiredTokens || 0}
        />
      </div>

      {/* Quick Actions - Important user actions */}
      {/* <QuickActions /> */}

      {/* Main Stats - Core metrics */}
      <DashboardStatsClient
        stats={
          dashboardStats ?? {
            totalPosts: 0,
            publishedCount: 0,
            scheduledCount: 0,
            failedCount: 0,
            savedCount: 0,
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

      {/* Recent Posts - Full width for better visibility */}
      {/* <RecentPostsSection posts={posts} isLoading={isLoading} /> */}

      {/* Schedule Section - Full width for better visibility */}
      <UpcomingSchedule upcomingPosts={upcomingPosts ?? []} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen overflow-auto bg-background">
      <DashboardClient />
    </div>
  );
}
