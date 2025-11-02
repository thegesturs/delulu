import type { CalendarEvent, EventColor } from '@delulu/design-system/components/event-calendar';
import type { Post } from '@/types/convex';

/**
 * Extract post title from content blocks
 * Takes the first text content as the title, or returns a default
 */
function extractPostTitle(content: Post['content']): string {
  if (!content || content.length === 0) {
    return '(Untitled post)';
  }

  // Find first block with text
  const firstTextBlock = content.find((block) => block.text && block.text.trim());

  if (firstTextBlock && firstTextBlock.text) {
    // Truncate to 50 characters for calendar display
    const title = firstTextBlock.text.trim();
    return title.length > 50 ? `${title.substring(0, 50)}...` : title;
  }

  // Check if there's media in any block
  const hasMedia = content.some((block) => block.media && block.media.length > 0);
  if (hasMedia) {
    return '(Media post)';
  }

  return '(Untitled post)';
}

/**
 * Get event color based on post status
 */
function getColorByStatus(status: Post['status']): EventColor {
  switch (status) {
    case 'SCHEDULED':
      return 'sky';
    case 'PROCESSING':
      return 'amber';
    case 'FAILED':
      return 'rose';
    case 'PUBLISHED':
      return 'emerald';
    case 'SAVED':
      return 'violet';
    default:
      return 'sky';
  }
}

/**
 * Transform a Convex Post to a CalendarEvent
 */
export function postToCalendarEvent(post: Post): CalendarEvent | null {
  // Only include scheduled posts
  if (!post.scheduledAt || post.status !== 'SCHEDULED') {
    return null;
  }

  const startDate = new Date(post.scheduledAt);
  // Default duration: 1 hour for calendar display
  const endDate = new Date(post.scheduledAt + 3600000);

  // Create description with social platforms
  const platformNames = post.socialProviders
    ?.map((provider) => provider.socialType)
    .join(', ') || '';

  return {
    id: post._id,
    title: extractPostTitle(post.content),
    description: platformNames || 'No platforms selected',
    start: startDate,
    end: endDate,
    allDay: false,
    color: getColorByStatus(post.status),
  };
}

/**
 * Transform an array of Posts to CalendarEvents
 * Filters out posts that shouldn't be shown on the calendar
 */
export function postsToCalendarEvents(posts: Post[]): CalendarEvent[] {
  return posts
    .map(postToCalendarEvent)
    .filter((event): event is CalendarEvent => event !== null);
}

/**
 * Transform a CalendarEvent back to post update data
 * Used when rescheduling posts via drag-and-drop
 */
export function calendarEventToPostUpdate(event: CalendarEvent) {
  return {
    id: event.id,
    scheduledAt: event.start.getTime(),
  };
}
