'use client';

import { useCallback } from 'react';

import { Button } from '@delulu/design-system/components/ui/button';
import { Card, CardContent } from '@delulu/design-system/components/ui/card';
import {} from '@delulu/design-system/components/ui/popover';

// Import specific hooks from Zustand store
import {
  useDateTime,
  usePost,
  useSelectedSocialProviders, // Assuming this returns the post object and its setter or use a specific setter hook if available
  useStore, // Import useStore to access setDateAlongWithTime
} from '@/store/post';
import { api } from '@/trpc/react';
// import { SocialIcon } from '../common/social-icon';
import { NaturalDatePicker } from '@delulu/design-system/components/ui/natural-date-picker';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
// Removed: import { useShallow } from 'zustand/shallow';
import SocialSelector from './social-selector';

export function PostSidebar() {
  const { date } = useDateTime(); // We only need date, as it will contain time
  const post = usePost();
  const setDateAlongWithTime = useStore((state) => state.setDateAlongWithTime); // Get the action
  const socialProviders = useSelectedSocialProviders();
  const utils = api.useUtils();
  const { postId } = useParams<{ postId: string | undefined }>();

  const { mutateAsync: createPost } = api.socialProvider.createPost.useMutation(
    {
      onSuccess: () => {
        toast.success('Post created successfully');
        utils.post.getPostsByUserId.invalidate();
      },
      onError: () => {
        toast.error('Failed to create post');
      },
    }
  );

  const { mutateAsync: updatePost } = api.post.updatePost.useMutation({
    onSuccess: () => {
      toast.success('Post updated successfully');
      utils.post.getPostsByUserId.invalidate();
    },
    onError: () => {
      toast.error('Failed to update post');
    },
  });

  const { mutateAsync: savePost } = api.post.savePost.useMutation({
    onSuccess: () => {
      toast.success('Post saved successfully');
      utils.post.getPostsByUserId.invalidate();
    },
    onError: () => {
      toast.error('Failed to save post');
    },
  });

  const handleSchedule = useCallback(() => {
    // TODO: Implement scheduling logic
  }, []);

  const handlePostNow = () => {
    createPost({
      content: post.content,
      socialProviders: socialProviders,
      alternativeContent: post.alternativeContent,
    });
  };

  const handleUpdatePost = () => {
    if (!postId) {
      toast.error('Post ID is required');
      return;
    }
    updatePost({
      postId: postId,
      content: post.content,
      socialProviders: socialProviders,
      alternativeContent: post.alternativeContent,
    });
  };

  const handleSavePost = () => {
    if (!postId) {
      toast.error('Post ID is required');
      return;
    }
    savePost({
      ...post,
      socialProviders: socialProviders,
      alternativeContent: post.alternativeContent,
      scheduledTime: date,
      content: post.content,
    });
  };

  // const handleProviderToggle = useCallback(
  //   (provider: SocialProviderType) => {
  //     const isSelected = post.alternativeContent.some(
  //       (content) => content.socialProvider.socialId === provider.socialId
  //     );

  //     if (isSelected) {
  //       // Remove provider
  //       updatePost({
  //         // Use updatePost from postActions
  //         alternativeContent: post.alternativeContent.filter(
  //           (content) => content.socialProvider.socialId !== provider.socialId
  //         ),
  //       });
  //     } else {
  //       // Add provider with default content
  //       updatePost({
  //         // Use updatePost from postActions
  //         alternativeContent: [
  //           ...post.alternativeContent,
  //           {
  //             socialProvider: provider,
  //             content: [
  //               {
  //                 id: '',
  //                 order: 0,
  //                 name: provider.name,
  //                 media: [],
  //                 text: post.content[0]?.text || '',
  //                 tags: [],
  //                 socialId: provider.socialId,
  //               },
  //             ],
  //           },
  //         ],
  //       });
  //     }
  //   },
  //   [post, updatePost] // updatePost is stable
  // );

  return (
    <Card className="w-[500px]">
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
        <Button className="w-full" onClick={handleUpdatePost}>
          Update Post
        </Button>
      </CardContent>
      <CardContent>
        <SocialSelector />
      </CardContent>
    </Card>
  );
}
