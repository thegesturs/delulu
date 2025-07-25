'use client';

import { PostsView } from '@/components/posts/posts-view';
import { api } from '@delulu/database/convex/_generated/api';
import { Badge } from '@delulu/design-system/components/ui/badge';
import { Button } from '@delulu/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@delulu/design-system/components/ui/card';
import { useQuery } from 'convex/react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/layout/header';

export const dynamic = 'force-dynamic';

function DashboardClient() {
  const router = useRouter();
  const dashboardStats = useQuery(api.stats.getDashboardStats);
  const recentPosts = useQuery(api.posts.getPosts, {
    paginationOpts: { numItems: 4, cursor: null },
  });
  const failedPosts = useQuery(api.stats.getFailedPosts);
  const upcomingPosts = useQuery(api.stats.getUpcomingPosts, { days: 7 });

  const posts = recentPosts?.page || [];
  const stats = dashboardStats || {
    totalPosts: 0,
    publishedCount: 0,
    scheduledCount: 0,
    failedCount: 0,
    connectedAccounts: 0,
    upcomingPosts: 0,
    thisWeekPosts: 0,
    lastWeekPosts: 0,
    successRate: 0,
    expiredTokens: 0,
  };

  // Calculate trend for this week vs last week
  const weeklyTrend =
    stats.lastWeekPosts > 0
      ? ((stats.thisWeekPosts - stats.lastWeekPosts) / stats.lastWeekPosts) *
        100
      : stats.thisWeekPosts > 0
        ? 100
        : 0;

  const isLoading = !dashboardStats;

  return (
    <div className="space-y-8 p-8">
      <Header pages={['Dashboard']} page="Overview">
        <Button onClick={() => router.push('/post')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Post
        </Button>
      </Header>

      {/* Quick Stats */}
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
            <CheckCircle className="h-4 w-4 text-green-600" />
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
                <span className="text-green-600">All active</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">This Week</CardTitle>
            {weeklyTrend >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {isLoading ? '...' : stats.thisWeekPosts}
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span
                className={`${weeklyTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}
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
            <Clock className="h-4 w-4 text-blue-600" />
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
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {isLoading ? '...' : stats.scheduledCount}
            </div>
            <p className="text-muted-foreground text-xs">Ready to publish</p>
          </CardContent>
        </Card>

        {stats.failedCount > 0 && (
          <Card className="border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-red-800 text-sm">
                Failed Posts
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-red-800">
                {isLoading ? '...' : stats.failedCount}
              </div>
              <p className="text-red-600 text-xs">Need attention</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Failed Posts Alert */}
      {failedPosts && failedPosts.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <CardTitle className="text-red-800 dark:text-red-200">
                Failed Posts Need Attention
              </CardTitle>
            </div>
            <CardDescription className="text-red-700 dark:text-red-300">
              {failedPosts.length} post{failedPosts.length > 1 ? 's' : ''}{' '}
              failed to publish
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {failedPosts.slice(0, 3).map((post) => (
                <div
                  key={post._id}
                  className="flex items-center justify-between rounded border bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {post.content[0]?.text?.slice(0, 60)}...
                    </p>
                    <p className="mt-1 text-red-600 text-xs dark:text-red-400">
                      {post.postFailureReason || 'Publishing failed'}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/post/${post._id}/edit`)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        // TODO: Add retry functionality
                        console.log('Retry post:', post._id);
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              ))}
              {failedPosts.length > 3 && (
                <Button
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => router.push('/posts?status=FAILED')}
                >
                  View all {failedPosts.length} failed posts
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Schedule */}
      {upcomingPosts && upcomingPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
            <CardDescription>
              Posts scheduled for the next 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingPosts.slice(0, 5).map((post) => (
                <div
                  key={post._id}
                  className="flex items-center justify-between rounded bg-muted/50 p-3"
                >
                  <div className="flex-1">
                    <div className="mb-1 flex items-center space-x-2">
                      <p className="font-medium text-sm">
                        {post.content[0]?.text?.slice(0, 50)}
                      </p>
                      <div className="flex space-x-1">
                        {post.socialProviders.slice(0, 3).map(
                          (provider) =>
                            provider && (
                              <Badge
                                key={provider._id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {provider.socialType}
                              </Badge>
                            )
                        )}
                      </div>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {post.scheduledAt
                        ? new Date(post.scheduledAt).toLocaleString()
                        : 'No date set'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/post/${post._id}/edit`)}
                  >
                    Edit
                  </Button>
                </div>
              ))}
              {upcomingPosts.length > 5 && (
                <Button
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => router.push('/calendar')}
                >
                  View full schedule ({upcomingPosts.length} posts)
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
          <CardDescription>
            Your latest content across platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length > 0 ? (
            <PostsView posts={posts} layout="grid" />
          ) : recentPosts ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No posts yet. Create your first post to get started!
              </p>
              <Button
                onClick={() => router.push('/post')}
                className="mt-4"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Post
              </Button>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Loading recent posts...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Health Alert */}
      {stats.expiredTokens > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <CardTitle className="text-amber-800 dark:text-amber-200">
                Platform Connection Issues
              </CardTitle>
            </div>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              {stats.expiredTokens} social account
              {stats.expiredTokens > 1 ? 's need' : ' needs'} to be reconnected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-amber-700 text-sm dark:text-amber-300">
                Some of your social media accounts have expired authentication
                tokens. Posts may fail to publish until these are reconnected.
              </p>
              <Button
                onClick={() => router.push('/socials')}
                size="sm"
                className="ml-4"
              >
                Fix Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card
          className="cursor-pointer hover:bg-accent/50"
          onClick={() => router.push('/socials')}
        >
          <CardHeader>
            <CardTitle>Social Accounts</CardTitle>
            <CardDescription>Manage your connected platforms</CardDescription>
          </CardHeader>
        </Card>
        <Card
          className="cursor-pointer hover:bg-accent/50"
          onClick={() => router.push('/calendar')}
        >
          <CardHeader>
            <CardTitle>Content Calendar</CardTitle>
            <CardDescription>
              View and plan your content schedule
            </CardDescription>
          </CardHeader>
        </Card>
        <Card
          className="cursor-pointer hover:bg-accent/50"
          onClick={() => router.push('/posts')}
        >
          <CardHeader>
            <CardTitle>All Posts</CardTitle>
            <CardDescription>
              Browse and manage all your content
            </CardDescription>
          </CardHeader>
        </Card>
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
