'use client';

import { useQuery, useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CalendarPlus } from 'lucide-react';
import { EventCalendar } from '@delulu/design-system/components/event-calendar';
import type { CalendarEvent } from '@delulu/design-system/components/event-calendar';
import { Button } from '@delulu/design-system/components/ui/button';
import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { postsToCalendarEvents, calendarEventToPostUpdate } from '@/lib/calendar-utils';

export function CalendarClient() {
  const router = useRouter();

  // Fetch scheduled posts
  const scheduledPosts = useQuery(api.posts.getPosts, {
    status: 'SCHEDULED',
    paginationOpts: { numItems: 1000, cursor: null }, // Fetch all scheduled posts for calendar
  });

  // Mutations
  const updatePost = useMutation(api.posts.updatePost);
  const softDeletePost = useMutation(api.posts.softDeletePost);

  // Transform posts to calendar events
  const events = scheduledPosts ? postsToCalendarEvents(scheduledPosts.page) : [];

  // Handle event reschedule via drag-and-drop
  const handleEventUpdate = async (event: CalendarEvent) => {
    try {
      const updateData = calendarEventToPostUpdate(event);
      await updatePost({
        id: updateData.id as Id<'posts'>,
        scheduledAt: updateData.scheduledAt,
      });

      toast.success('Post rescheduled successfully', {
        description: `Scheduled for ${event.start.toLocaleString()}`,
      });
    } catch (error) {
      console.error('Failed to reschedule post:', error);
      toast.error('Failed to reschedule post', {
        description: 'Please try again',
      });
    }
  };

  // Handle event delete
  const handleEventDelete = async (eventId: string) => {
    try {
      await softDeletePost({
        id: eventId as Id<'posts'>,
      });

      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Failed to delete post', {
        description: 'Please try again',
      });
    }
  };

  // Navigate to compose page with pre-filled schedule time
  const handleCreatePost = () => {
    router.push('/compose');
  };

  if (!scheduledPosts) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
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
          className="h-full"
        />
      </div>
    </div>
  );
}
