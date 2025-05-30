'use client';

import { useCallback } from 'react';

import { Button } from '@delulu/design-system/components/ui/button';
import { Card, CardContent } from '@delulu/design-system/components/ui/card';
import {} from '@delulu/design-system/components/ui/popover';
// import { TimeInput } from '@delulu/design-system/components/ui/time-input';
import type { SocialProviderType } from '@delulu/validators/post';

// Import specific hooks from Zustand store
import {
  postActions, // For setPost, setDate, setTime actions
  useDateTime,
  usePost, // Assuming this returns the post object and its setter or use a specific setter hook if available
  useStore, // Import useStore to access setDateAlongWithTime
} from '@/store/post';
// import { SocialIcon } from '../common/social-icon';
import { NaturalDatePicker } from '@delulu/design-system/components/ui/natural-date-picker';
// Removed: import { useShallow } from 'zustand/shallow';
import SocialSelector from './social-selector';

export function PostSidebar() {
  const { date } = useDateTime(); // We only need date, as it will contain time
  const post = usePost();
  const setDateAlongWithTime = useStore((state) => state.setDateAlongWithTime); // Get the action

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
              <NaturalDatePicker
                className="w-full"
                value={date}
                onChange={setDateAlongWithTime}
                placeholder="Select date and time..."
                
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardContent className="flex flex-col gap-2">
        <Button className="w-full" onClick={handlePostNow}>
          {date ? 'Schedule Post' : 'Post Now'}
        </Button>
      </CardContent>
      <CardContent>
        <SocialSelector />
      </CardContent>
    </Card>
  );
}
