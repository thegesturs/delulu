'use client';

import { PostsView } from '@/components/posts/posts-view';
import { api } from '@delulu/database/convex/_generated/api';
import { Button } from '@delulu/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@delulu/design-system/components/ui/card';
import { useQuery } from 'convex/react';
import { BarChart3, Calendar, Plus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/layout/header';

export const dynamic = 'force-dynamic';

function DashboardClient() {
  const router = useRouter();
  const recentPosts = useQuery(api.posts.getPosts, {
    paginationOpts: { numItems: 4, cursor: null },
  });

  const posts = recentPosts?.page || [];
  const totalPosts = posts.length;

  return (
    <div className="space-y-8 p-8">
      <Header pages={['Dashboard']} page="Overview">
        <Button onClick={() => router.push('/post')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Post
        </Button>
      </Header>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Posts</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{totalPosts}</div>
            <p className="text-muted-foreground text-xs">
              Your published content
            </p>
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
            <div className="font-bold text-2xl">3</div>
            <p className="text-muted-foreground text-xs">
              Active social connections
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Upcoming Posts
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">7</div>
            <p className="text-muted-foreground text-xs">
              Scheduled for next week
            </p>
          </CardContent>
        </Card>
      </div>

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
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Loading recent posts...</p>
            </div>
          )}
        </CardContent>
      </Card>

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
