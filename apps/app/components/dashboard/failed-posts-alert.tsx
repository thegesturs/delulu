'use client';

import type { FailedPost } from '@/types/convex';
import { Button } from '@delulu/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@delulu/design-system/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FailedPostsAlertProps {
  failedPosts: FailedPost[];
}

export function FailedPostsAlert({ failedPosts }: FailedPostsAlertProps) {
  const router = useRouter();

  if (!failedPosts || failedPosts.length === 0) {
    return null;
  }

  return (
    <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <CardTitle className="text-red-800 dark:text-red-200">
            Failed Posts Need Attention
          </CardTitle>
        </div>
        <CardDescription className="text-red-700 dark:text-red-300">
          {failedPosts.length} post{failedPosts.length > 1 ? 's' : ''} failed to
          publish
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
                  {post.content?.[0]?.text?.slice(0, 60) || 'No content'}...
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
  );
}
