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
import { Alert01Icon } from "@hugeicons-pro/core-solid-rounded";
import { useRouter } from "next/navigation";
import type { FailedPost } from "@/types/convex";

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
          <Icon
            className="text-red-600 dark:text-red-400"
            icon={Alert01Icon}
            size={20}
          />
          <CardTitle className="text-red-800 dark:text-red-200">
            Failed Posts Need Attention
          </CardTitle>
        </div>
        <CardDescription className="text-red-700 dark:text-red-300">
          {failedPosts.length} post{failedPosts.length > 1 ? "s" : ""} failed to
          publish
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {failedPosts.slice(0, 3).map((post) => (
            <div
              className="flex items-center justify-between rounded border bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
              key={post._id}
            >
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {post.content?.[0]?.text?.slice(0, 60) || "No content"}...
                </p>
                <p className="mt-1 text-red-600 text-xs dark:text-red-400">
                  {post.postFailureReason || "Publishing failed"}
                </p>
              </div>
              <div className="ml-4 flex items-center space-x-2">
                <Button
                  onClick={() => router.push(`/post/${post._id}/edit`)}
                  size="sm"
                  variant="outline"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => {
                    // TODO: Add retry functionality
                    console.log("Retry post:", post._id);
                  }}
                  size="sm"
                >
                  Retry
                </Button>
              </div>
            </div>
          ))}
          {failedPosts.length > 3 && (
            <Button
              className="mt-2 w-full"
              onClick={() => router.push("/posts?status=FAILED")}
              variant="outline"
            >
              View all {failedPosts.length} failed posts
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
