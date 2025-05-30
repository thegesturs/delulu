'use client';

import { useCallback } from 'react';
import { IoCalendarOutline } from 'react-icons/io5';

import { Button } from '@delulu/design-system/components/ui/button';
import { Calendar } from '@delulu/design-system/components/ui/calendar';
import { Card, CardContent } from '@delulu/design-system/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@delulu/design-system/components/ui/popover';
// import { TimeInput } from '@delulu/design-system/components/ui/time-input';
import type { SocialProviderType } from '@delulu/validators/post';

// Import specific hooks from Zustand store
import {
  postActions, // For setPost, setDate, setTime actions
  useDateTime,
  usePost, // Assuming this returns the post object and its setter or use a specific setter hook if available
  useSelectedSocialProviders,
} from '@/store/post';
// Removed: import { useStore } from '@/store/post';
// Removed: import { useShallow } from 'zustand/shallow';
import SocialSelector from './social-selector';
// import { SocialIcon } from '../common/social-icon';

export function PostSidebar() {
  const { date, time } = useDateTime();
  const post = usePost(); // Assuming usePost() now returns only the post object
  const socialProviders = useSelectedSocialProviders();

  // Destructure actions from postActions
  const { updatePost } = postActions;

  const handleSchedule = useCallback(() => {
    // TODO: Implement scheduling logic
  }, []);

  const handlePostNow = useCallback(() => {
    // TODO: Implement post now logic
  }, []);

  const handleProviderToggle = useCallback(
    (provider: SocialProviderType) => {
      const isSelected = post.alternativeContent.some(
        (content) => content.socialProvider.socialId === provider.socialId
      );

      if (isSelected) {
        // Remove provider
        updatePost({
          // Use updatePost from postActions
          alternativeContent: post.alternativeContent.filter(
            (content) => content.socialProvider.socialId !== provider.socialId
          ),
        });
      } else {
        // Add provider with default content
        updatePost({
          // Use updatePost from postActions
          alternativeContent: [
            ...post.alternativeContent,
            {
              socialProvider: provider,
              content: [
                {
                  id: '',
                  order: 0,
                  name: provider.name,
                  media: [],
                  text: post.content[0]?.text || '',
                  tags: [],
                  socialId: provider.socialId,
                },
              ],
            },
          ],
        });
      }
    },
    [post, updatePost] // updatePost is stable
  );

  return (
    <Card className="w-80">
      <CardContent>
        <div className="space-y-6">
          <div>
            <div id="schedule-label" className="mb-2 block font-medium text-sm">
              Schedule Post
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={date ? 'w-[280px]' : 'w-[280px] justify-start'}
                    aria-labelledby="schedule-label"
                  >
                    <IoCalendarOutline className="mr-2 h-4 w-4" />
                    {date ? date.toLocaleDateString() : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    // onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {date && (
            <div>
              <div id="time-label" className="mb-2 block font-medium text-sm">
                Time
              </div>
              {/* <TimeInput
                value={time || ''}
                onChange={setTime}
                aria-labelledby="time-label"
              /> */}
            </div>
          )}
        </div>
      </CardContent>
      <CardContent className="flex flex-col gap-2">
        <Button
          className="w-full"
          onClick={handlePostNow}
          disabled={!date && !time}
        >
          Post Now
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleSchedule}
          disabled={!date || !time}
        >
          Schedule Post
        </Button>
      </CardContent>
      <CardContent>
        <SocialSelector />
      </CardContent>
    </Card>
  );
}
