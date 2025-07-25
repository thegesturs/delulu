'use client';

import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { FailedPostsAlert } from '@/components/dashboard/failed-posts-alert';
import { PlatformHealthAlert } from '@/components/dashboard/platform-health-alert';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentPostsSection } from '@/components/dashboard/recent-posts-section';
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
  const failedPosts = useQuery(api.stats.getFailedPosts);
  const upcomingPosts = useQuery(api.stats.getUpcomingPosts, { days: 7 });

  const posts = recentPosts?.page || [];
  const isLoading = !dashboardStats || !recentPosts;

  return (
    <div className="space-y-8 p-8">
      <Header pages={['Dashboard']} page="Overview">
        <Button onClick={() => router.push('/post')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Post
        </Button>
      </Header>

      {/* Failed Posts Alert */}
      <FailedPostsAlert failedPosts={failedPosts || []} />

      {/* Platform Health Alert */}
      <PlatformHealthAlert expiredTokens={dashboardStats?.expiredTokens || 0} />

      {/* Dashboard Stats */}
      <DashboardStats
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
          }
        }
        isLoading={isLoading}
      />

      {/* Upcoming Schedule */}
      <UpcomingSchedule upcomingPosts={upcomingPosts ?? []} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Posts */}
        <RecentPostsSection posts={posts} isLoading={isLoading} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardClient />
    </div>
  );
}
