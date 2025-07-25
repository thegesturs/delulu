'use client';

import { Badge } from '@delulu/design-system/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@delulu/design-system/components/ui/card';
import {
  CheckCircle,
  Clock,
  Calendar,
  FileText,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    totalPosts: number;
    publishedCount: number;
    scheduledCount: number;
    failedCount: number;
    savedCount: number;
    upcomingPosts: number;
    thisWeekPosts: number;
    lastWeekPosts: number;
    successRate: number;
    connectedAccounts: number;
    expiredTokens: number;
  };
  isLoading: boolean;
}

export function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  // Calculate trend for this week vs last week
  const weeklyTrend =
    stats.lastWeekPosts > 0
      ? ((stats.thisWeekPosts - stats.lastWeekPosts) / stats.lastWeekPosts) * 100
      : stats.thisWeekPosts > 0
        ? 100
        : 0;

  return (
    <>
      {/* Primary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
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
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {isLoading ? '...' : stats.publishedCount}
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-muted-foreground">
                {isLoading ? '...' : stats.successRate}% success rate
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Connected Accounts
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
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
                <span className="text-green-600 dark:text-green-400">All active</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">This Week</CardTitle>
            {weeklyTrend >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {isLoading ? '...' : stats.thisWeekPosts}
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span
                className={`${weeklyTrend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {isLoading
                  ? '...'
                  : weeklyTrend > 0
                    ? `+${weeklyTrend.toFixed(0)}%`
                    : `${weeklyTrend.toFixed(0)}%`}
              </span>
              <span className="text-muted-foreground">vs last week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Upcoming Posts
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-red-800 dark:text-red-200">
                {isLoading ? '...' : stats.failedCount}
              </div>
              <p className="text-red-600 text-xs dark:text-red-400">Need attention</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}