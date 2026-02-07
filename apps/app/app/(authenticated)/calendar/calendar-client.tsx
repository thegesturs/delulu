"use client";

import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import type { CalendarEvent } from "@delulu/design-system/components/event-calendar";
import { EventCalendar } from "@delulu/design-system/components/event-calendar";
import { Button } from "@delulu/design-system/components/ui/button";
import { Icon } from "@delulu/design-system/providers/icon";
import { CalendarPlus } from "@hugeicons-pro/core-solid-rounded";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { PostPreviewDialog } from "@/components/posts/post-preview-dialog";
import {
  calendarEventToPostUpdate,
  postsToCalendarEvents,
} from "@/lib/calendar-utils";

export function CalendarClient() {
  const router = useRouter();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // For now, fetch posts for current month +/- 2 months (total 5 months range)
  // This covers most calendar navigation without constant refetching
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const threeMonthsLater = new Date(now.getFullYear(), now.getMonth() + 3, 0);

    return {
      startDate: twoMonthsAgo.getTime(),
      endDate: threeMonthsLater.getTime(),
    };
  }, []);

  // Fetch scheduled posts for the date range
  const scheduledPosts = useQuery(api.posts.getScheduledPostsByDateRange, {
    startDate,
    endDate,
  });

  // Fetch selected post details for preview
  const selectedPost = useQuery(
    api.posts.getPostById,
    selectedPostId ? { id: selectedPostId as Id<"posts"> } : "skip"
  );

  // Mutations
  const updatePostScheduledTime = useMutation(
    api.posts.updatePostScheduledTime
  );
  const softDeletePost = useMutation(api.posts.softDeletePost);

  // Transform posts to calendar events
  const events = useMemo(() => {
    return scheduledPosts ? postsToCalendarEvents(scheduledPosts) : [];
  }, [scheduledPosts]);

  // Handle event reschedule via drag-and-drop
  const handleEventUpdate = useCallback(
    async (event: CalendarEvent) => {
      try {
        const updateData = calendarEventToPostUpdate(event);
        await updatePostScheduledTime({
          id: updateData.id as Id<"posts">,
          scheduledAt: updateData.scheduledAt,
        });
      } catch (error) {
        console.error("Failed to reschedule post:", error);
        toast.error("Failed to reschedule post", {
          description:
            error instanceof Error ? error.message : "Please try again",
        });
      }
    },
    [updatePostScheduledTime]
  );

  // Handle event delete
  const handleEventDelete = useCallback(
    async (eventId: string) => {
      try {
        await softDeletePost({
          id: eventId as Id<"posts">,
        });

        toast.success("Post deleted");
        setIsPreviewOpen(false);
        setSelectedPostId(null);
      } catch (error) {
        console.error("Failed to delete post:", error);
        toast.error("Failed to delete post");
      }
    },
    [softDeletePost]
  );

  // Navigate to post creation page
  const handleCreatePost = useCallback(() => {
    router.push("/post");
  }, [router]);

  // Handle slot click - redirect to post with scheduledAt param
  const handleEventCreate = useCallback(
    (startTime: Date) => {
      router.push(`/post?scheduledAt=${startTime.getTime()}`);
    },
    [router]
  );

  // Handle event click - open post preview dialog
  const handleEventSelect = useCallback((event: CalendarEvent) => {
    setSelectedPostId(event.id);
    setIsPreviewOpen(true);
  }, []);

  if (scheduledPosts === undefined) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-32 w-32 animate-spin rounded-full border-primary border-t-2 border-b-2" />
          <p className="mt-4 text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            View and manage your scheduled posts
          </p>
        </div>
        <Button onClick={handleCreatePost} size="lg">
          <Icon className="mr-2" icon={CalendarPlus} size={20} />
          Create Post
        </Button>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-y-auto">
        <EventCalendar
          events={events}
          initialView="week"
          onEventCreate={handleEventCreate}
          onEventDelete={handleEventDelete}
          onEventSelect={handleEventSelect}
          onEventUpdate={handleEventUpdate}
        />
      </div>

      {/* Post Preview Dialog */}
      {selectedPost && (
        <PostPreviewDialog
          onOpenChange={(open) => {
            setIsPreviewOpen(open);
            if (!open) {
              setSelectedPostId(null);
            }
          }}
          open={isPreviewOpen}
          post={selectedPost}
        />
      )}
    </div>
  );
}
