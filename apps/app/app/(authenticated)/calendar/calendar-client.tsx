"use client";

import { POST_DELETED, POST_RESCHEDULED } from "@delulu/analytics/events";
import { useAnalytics } from "@delulu/analytics/posthog/client";
import { invalidateWorkspaceResource } from "@delulu/client";
import type { CalendarEvent } from "@delulu/design-system/components/event-calendar";
import { EventCalendar } from "@delulu/design-system/components/event-calendar";
import { Button } from "@delulu/design-system/components/ui/button";
import { Icon } from "@delulu/design-system/providers/icon";
import { CalendarPlus } from "@hugeicons-pro/core-solid-rounded";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useApiClient } from "@/components/providers/api-client";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";

interface TargetMutation {
  postId: string;
  targetId: string;
  scheduledAt: string;
}

export function CalendarClient() {
  const router = useRouter();
  const analytics = useAnalytics();
  const queryClient = useQueryClient();
  const { workspaceId, isPending: isWorkspacePending } = useActiveWorkspace();
  const { resources } = useApiClient();
  const scheduledPosts = useQuery({
    ...resources.posts.list(workspaceId ?? "", {
      limit: 250,
      status: "scheduled",
    }),
    enabled: Boolean(workspaceId),
    staleTime: 30_000,
    retry: 2,
  });

  const invalidatePosts = useCallback(async () => {
    if (!workspaceId) {
      return;
    }
    await invalidateWorkspaceResource(queryClient, workspaceId, "posts");
  }, [queryClient, resources, workspaceId]);

  const updateTarget = useMutation({
    mutationFn: async ({ postId, targetId, scheduledAt }: TargetMutation) => {
      if (!workspaceId) {
        throw new Error("Select a workspace before rescheduling");
      }
      const mutation = resources.posts.updateTarget(
        workspaceId,
        postId,
        targetId
      );
      if (!mutation.mutationFn) {
        throw new Error("Update target is unavailable");
      }
      return mutation.mutationFn({ scheduledAt });
    },
    onSuccess: invalidatePosts,
  });
  const removePost = useMutation({
    mutationFn: async (postId: string) => {
      if (!workspaceId) {
        throw new Error("Select a workspace before deleting");
      }
      const mutation = resources.posts.remove(workspaceId);
      if (!mutation.mutationFn) {
        throw new Error("Delete post is unavailable");
      }
      return mutation.mutationFn(postId);
    },
    onSuccess: invalidatePosts,
  });

  const targetByEventId = useMemo(() => {
    const index = new Map<string, { postId: string; targetId: string }>();
    for (const post of scheduledPosts.data?.data ?? []) {
      for (const target of post.targets) {
        index.set(`${post.id}:${target.id}`, {
          postId: post.id,
          targetId: target.id,
        });
      }
    }
    return index;
  }, [scheduledPosts.data]);

  const events = useMemo<CalendarEvent[]>(
    () =>
      (scheduledPosts.data?.data ?? []).flatMap((post) => {
        const title =
          post.groups
            .flatMap((group) => group.segments)
            .find((segment) => segment.text.trim())?.text ?? "Untitled post";
        return post.targets.flatMap((target) => {
          if (!target.scheduledAt) {
            return [];
          }
          const start = new Date(target.scheduledAt);
          return [
            {
              id: `${post.id}:${target.id}`,
              title,
              description: target.settings.platform,
              start,
              end: new Date(start.getTime() + 3_600_000),
              allDay: false,
              color: "sky" as const,
            },
          ];
        });
      }),
    [scheduledPosts.data]
  );

  const handleEventUpdate = useCallback(
    async (event: CalendarEvent) => {
      const target = targetByEventId.get(event.id);
      if (!target) {
        return;
      }
      try {
        await updateTarget.mutateAsync({
          ...target,
          scheduledAt: event.start.toISOString(),
        });
        analytics.capture(POST_RESCHEDULED, {
          post_id: target.postId,
          new_scheduled_at: event.start.toISOString(),
        });
      } catch (error) {
        toast.error("Failed to reschedule post", {
          description:
            error instanceof Error ? error.message : "Please try again",
        });
      }
    },
    [analytics, targetByEventId, updateTarget]
  );

  const handleEventDelete = useCallback(
    async (eventId: string) => {
      const target = targetByEventId.get(eventId);
      if (!target) {
        return;
      }
      try {
        await removePost.mutateAsync(target.postId);
        analytics.capture(POST_DELETED, {
          post_id: target.postId,
          source: "calendar",
        });
        toast.success("Post deleted");
      } catch (error) {
        toast.error("Failed to delete post", {
          description: error instanceof Error ? error.message : undefined,
        });
      }
    },
    [analytics, removePost, targetByEventId]
  );

  if (isWorkspacePending || scheduledPosts.isPending) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 animate-spin rounded-full border-primary border-t-2" />
          <p className="mt-4 text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }
  if (scheduledPosts.isError || !workspaceId) {
    return (
      <div className="m-6 rounded-lg border border-destructive/40 p-4 text-destructive">
        <p>
          {scheduledPosts.error?.message ??
            "Select a workspace to view its calendar."}
        </p>
        <Button
          className="mt-3"
          onClick={() => scheduledPosts.refetch()}
          variant="outline"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            View and manage your scheduled posts
            {scheduledPosts.isFetching ? " · refreshing" : ""}
          </p>
        </div>
        <Button onClick={() => router.push("/post")} size="lg">
          <Icon className="mr-2" icon={CalendarPlus} size={20} />
          Create Post
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <EventCalendar
          events={events}
          initialView="week"
          onEventCreate={(start) =>
            router.push(`/post?scheduledAt=${start.getTime()}`)
          }
          onEventDelete={handleEventDelete}
          onEventSelect={(event) => {
            const target = targetByEventId.get(event.id);
            if (target) {
              router.push(`/post/${target.postId}`);
            }
          }}
          onEventUpdate={handleEventUpdate}
        />
      </div>
    </div>
  );
}
