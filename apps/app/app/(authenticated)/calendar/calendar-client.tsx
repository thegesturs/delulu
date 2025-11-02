'use client';

import { PostPreviewDialog } from '@/components/posts/post-preview-dialog';
import {
  calendarEventToPostUpdate,
  postsToCalendarEvents,
} from '@/lib/calendar-utils';
import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { EventCalendar } from '@delulu/design-system/components/event-calendar';
import type {
  CalendarEvent,
  CalendarView,
} from '@delulu/design-system/components/event-calendar';
import { Button } from '@delulu/design-system/components/ui/button';
import { useMutation, useQuery } from 'convex/react';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { CalendarPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

/**
 * Calculate date range for fetching posts based on calendar view
 */
function getDateRange(
  date: Date,
  view: CalendarView
): { start: Date; end: Date } {
  switch (view) {
    case 'month': {
      // For month view, get the full month plus padding weeks
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const start = startOfWeek(monthStart, { weekStartsOn: 0 });
      const end = endOfWeek(monthEnd, { weekStartsOn: 0 });
      return { start, end };
    }
    case 'week': {
      const start = startOfWeek(date, { weekStartsOn: 0 });
      const end = endOfWeek(date, { weekStartsOn: 0 });
      return { start, end };
    }
    case 'day': {
      const start = startOfDay(date);
      const end = endOfDay(date);
      return { start, end };
    }
    case 'agenda': {
      // For agenda view, show next 30 days
      const start = startOfDay(date);
      const end = endOfDay(new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000));
      return { start, end };
    }
    default:
      return { start: startOfMonth(date), end: endOfMonth(date) };
  }
}

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
    selectedPostId ? { id: selectedPostId as Id<'posts'> } : 'skip'
  );

  // Mutations
  const updatePost = useMutation(api.posts.updatePost);
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
        await updatePost({
          id: updateData.id as Id<'posts'>,
          scheduledAt: updateData.scheduledAt,
        });

        toast.success('Post rescheduled', {
          description: `Scheduled for ${event.start.toLocaleString()}`,
        });
      } catch (error) {
        console.error('Failed to reschedule post:', error);
        toast.error('Failed to reschedule post', {
          description: 'Please try again',
        });
      }
    },
    [updatePost]
  );

  // Handle event delete
  const handleEventDelete = useCallback(
    async (eventId: string) => {
      try {
        await softDeletePost({
          id: eventId as Id<'posts'>,
        });

        toast.success('Post deleted');
        setIsPreviewOpen(false);
        setSelectedPostId(null);
      } catch (error) {
        console.error('Failed to delete post:', error);
        toast.error('Failed to delete post');
      }
    },
    [softDeletePost]
  );

  // Navigate to compose page
  const handleCreatePost = useCallback(() => {
    router.push('/compose');
  }, [router]);

  // Handle view/date changes to refetch data
  // Note: EventCalendar doesn't expose these callbacks, so we'll need to wrap it
  // For now, we'll fetch a wider range and rely on the query caching

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
          <CalendarPlus className="mr-2 h-5 w-5" />
          Create Post
        </Button>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-hidden">
        <EventCalendar
          events={events}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
          initialView="month"
        />
      </div>

      {/* Post Preview Dialog */}
      {selectedPost && (
        <PostPreviewDialog
          post={selectedPost}
          open={isPreviewOpen}
          onOpenChange={(open) => {
            setIsPreviewOpen(open);
            if (!open) {
              setSelectedPostId(null);
            }
          }}
        />
      )}
    </div>
  );
}
