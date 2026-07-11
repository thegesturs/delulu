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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OperationsError } from "@/components/operations/query-state";
import { useApiClient } from "@/components/providers/api-client";
import { useOperationsWorkspace } from "@/hooks/use-operations-workspace";

export function FailedPostsAlert() {
  const router = useRouter();
  const { resources } = useApiClient();
  const workspace = useOperationsWorkspace();
  const queryClient = useQueryClient();
  const workspaceId = workspace.workspaceId ?? "";
  const options = resources.posts.list(workspaceId, {
    limit: 4,
    offset: 0,
    status: "failed",
  });
  const query = useQuery({
    ...options,
    queryKey: options.queryKey!,
    enabled: !!workspace.workspaceId,
  });
  const failedPosts = query.data?.data ?? [];

  if (workspace.error || query.error) {
    return (
      <OperationsError
        error={(workspace.error ?? query.error)!}
        onRetry={async () => {
          await (workspace.error ? workspace.retry() : query.refetch());
        }}
      />
    );
  }

  if (!failedPosts.length) {
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
          {query.data?.total} post{query.data?.total === 1 ? "" : "s"} failed to
          publish
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {failedPosts.slice(0, 3).map((post) => (
          <FailedPostRow
            key={post.id}
            onEdit={() => router.push(`/post/${post.id}`)}
            onRetried={() =>
              queryClient.invalidateQueries({ queryKey: options.queryKey! })
            }
            post={post}
            resources={resources}
            workspaceId={workspaceId}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function FailedPostRow({
  post,
  resources,
  workspaceId,
  onEdit,
  onRetried,
}: {
  post: {
    readonly id: string;
    readonly groups: readonly {
      readonly segments: readonly { readonly text: string }[];
    }[];
    readonly targets: readonly {
      readonly id: string;
      readonly status: "pending" | "publishing" | "published" | "failed";
      readonly error: string | null;
    }[];
  };
  resources: ReturnType<typeof useApiClient>["resources"];
  workspaceId: string;
  onEdit: () => void;
  onRetried: () => Promise<unknown>;
}) {
  const failedTarget = post.targets.find(
    (target) => target.status === "failed"
  );
  const retry = useMutation(resources.posts.retryTarget(workspaceId, post.id));
  return (
    <div className="flex items-center justify-between gap-3 rounded border bg-background p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">
          {post.groups[0]?.segments[0]?.text || "Untitled post"}
        </p>
        <p className="truncate text-red-600 text-xs">
          {failedTarget?.error || "Publishing failed"}
        </p>
      </div>
      <Button onClick={onEdit} size="sm" variant="outline">
        Edit
      </Button>
      <Button
        disabled={!failedTarget || retry.isPending}
        onClick={async () => {
          if (!failedTarget) {
            return;
          }
          try {
            await retry.mutateAsync(failedTarget.id);
            await onRetried();
            toast.success("Publish retry queued");
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Retry failed"
            );
          }
        }}
        size="sm"
      >
        {retry.isPending ? "Retrying…" : "Retry"}
      </Button>
    </div>
  );
}
