"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@delulu/design-system/components/ui/card";
import { Icon } from "@delulu/design-system/providers/icon";
import { Plus } from "@hugeicons-pro/core-solid-rounded";
import { useRouter } from "next/navigation";
import { PostsView } from "@/components/posts/posts-view";
import type { Post } from "@/types/backend";

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
          <PostsView layout="grid" posts={posts} />
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
              className="mt-4"
              onClick={() => router.push("/post")}
              variant="outline"
            >
              <Icon className="mr-2" icon={Plus} size={16} />
              Create Post
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
