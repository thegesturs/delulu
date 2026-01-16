'use client';

import type { DashboardStats } from '@/types/convex';
import { Badge } from '@delulu/design-system/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@delulu/design-system/components/ui/card';
import { Icon } from '@delulu/design-system/providers/icon';
import {
  Calendar01Icon,
  TickDouble01Icon,
  ClockIcon,
  DocumentAttachmentIcon,
  FireIcon,
  UserMultipleIcon,
  CancelCircleIcon,
} from '@hugeicons-pro/core-solid-rounded';

interface DashboardStatsClientProps {
  stats: DashboardStats;
  isLoading: boolean;
}

export function DashboardStatsClient({
  stats,
  isLoading,
}: DashboardStatsClientProps) {
  return (
    <>
      {/* Primary Stats */}
      <div
        className="grid gap-2 md:grid-cols-2 lg:grid-cols-4"
        data-tour="dashboard-stats"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Posts</CardTitle>
            <Icon icon={DocumentAttachmentIcon} size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {isLoading ? '...' : stats.totalPosts}
            </div>
            <p className="text-muted-foreground text-xs">All your content</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Published</CardTitle>
            <Icon icon={TickDouble01Icon} size={16} className="text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {isLoading ? '...' : stats.publishedCount}
            </div>
            {/* <div className="flex items-center space-x-2 text-xs">
              <span className="text-muted-foreground">
                {isLoading ? '...' : stats.successRate}% success rate
              </span>
            </div> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Connected Accounts
            </CardTitle>
            <Icon icon={UserMultipleIcon} size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {isLoading ? '...' : stats.connectedAccounts}
            </div>
            <div className="flex items-center space-x-2 text-xs">
              {stats.expiredTokens > 0 && (
                <Badge variant="destructive" className="text-xs">
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
              icon={FireIcon}
              size={16}
              className={
                stats.postingStreak && stats.postingStreak > 0
                  ? 'text-orange-500 dark:text-orange-400'
                  : 'text-muted-foreground'
              }
            />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {isLoading ? '...' : stats.postingStreak || 0}
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-muted-foreground">
                {stats.postingStreak === 0
                  ? 'Start posting to build streak'
                  : stats.postingStreak === 1
                    ? 'day streak'
                    : 'days streak'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-2 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Upcoming Posts
            </CardTitle>
            <Icon icon={ClockIcon} size={16} className="text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {isLoading ? '...' : stats.upcomingPosts}
            </div>
            <p className="text-muted-foreground text-xs">
              Scheduled for next 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Scheduled</CardTitle>
            <Icon icon={Calendar01Icon} size={16} className="text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {isLoading ? '...' : stats.scheduledCount}
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
              <Icon icon={CancelCircleIcon} size={16} className="text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-red-800 dark:text-red-200">
                {isLoading ? '...' : stats.failedCount}
              </div>
              <p className="text-red-600 text-xs dark:text-red-400">
                Need attention
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
