'use client';

import { PostsView } from '@/components/posts/posts-view';
import type { Post } from '@/types/convex';
import { Button } from '@delulu/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@delulu/design-system/components/ui/card';
import { Icon } from '@delulu/design-system/providers/icon';

import { Plus } from '@hugeicons-pro/core-solid-rounded';
import { useRouter } from 'next/navigation';

interface RecentPostsSectionProps {
  posts: Post[];
  isLoading: boolean;
}

export function RecentPostsSection({
  posts,
  isLoading,
}: RecentPostsSectionProps) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Posts</CardTitle>
        <CardDescription>Your latest content across platforms</CardDescription>
      </CardHeader>
      <CardContent>
        {posts.length > 0 ? (
          <PostsView posts={posts} layout="grid" />
        ) : isLoading ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Loading recent posts...</p>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              No posts yet. Create your first post to get started!
            </p>
            <Button
              onClick={() => router.push('/post')}
              className="mt-4"
              variant="outline"
            >
              <Icon icon={Plus} size={16} className="mr-2 " />
              Create Post
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
