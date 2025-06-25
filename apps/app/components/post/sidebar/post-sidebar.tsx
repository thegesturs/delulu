'use client';

import { Button } from '@delulu/design-system/components/ui/button';
import { Card, CardContent } from '@delulu/design-system/components/ui/card';

import {
  useDateTime,
  usePost,
  useSelectedSocialProviders,
  useStore,
} from '@/store/post';
import { api } from '@/trpc/react';
import { NaturalDatePicker } from '@delulu/design-system/components/ui/natural-date-picker';
import { Loader } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { FaBookmark } from 'react-icons/fa';
import { PiPaperPlaneTiltFill } from 'react-icons/pi';
import { toast } from 'sonner';
import { uploadAllContentMedia } from '../../../hooks/use-upload-media';
import SocialSelector from './social-selector';

export function PostSidebar() {
  const { date } = useDateTime(); // We only need date, as it will contain time
  const post = usePost();
  const setDateAlongWithTime = useStore((state) => state.setDateAlongWithTime); // Get the action
  const socialProviders = useSelectedSocialProviders();
  const utils = api.useUtils();
  const { postId } = useParams<{ postId: string | undefined }>();
  const router = useRouter();

  const { mutateAsync: createPost, isPending: isCreatingPost } =
    api.socialProvider.createPost.useMutation({
      onSuccess: () => {
        toast.success('Post created successfully');
        utils.post.getPosts.invalidate();
        router.push('/posts');
      },
      onError: () => {
        toast.error('Failed to create post');
      },
    });

  const { mutateAsync: updatePost, isPending: isUpdatingPost } =
    api.post.updatePost.useMutation({
      onSuccess: () => {
        toast.success('Post updated successfully');
        utils.post.getPosts.invalidate();
        router.push('/posts');
      },
      onError: () => {
        toast.error('Failed to update post');
      },
    });

  const { mutateAsync: savePost, isPending: isSavingPost } =
    api.post.savePost.useMutation({
      onSuccess: () => {
        toast.success('Post saved successfully');
        utils.post.getPosts.invalidate();
        router.push('/posts');
      },
      onError: () => {
        toast.error('Failed to save post');
      },
    });

  const handlePostNow = async () => {
    try {
      // First upload all media files
      const { mainContent, alternativeContent } = await uploadAllContentMedia(
        post.content,
        post.alternativeContent
      );

      // Then create the post with uploaded media URLs
      await createPost({
        content: mainContent,
        socialProviders: socialProviders,
        alternativeContent: alternativeContent,
      });
    } catch (error) {
      console.error('Error posting:', error);
      // Handle error appropriately
    }
  };

  const handleUpdateSavePost = async () => {
    try {
      // First upload all media files
      const { mainContent, alternativeContent } = await uploadAllContentMedia(
        post.content,
        post.alternativeContent
      );

      if (postId) {
        await updatePost({
          postId: postId,
          content: mainContent,
          socialProviders: socialProviders,
          alternativeContent: alternativeContent,
        });
      } else {
        await savePost({
          id: postId,
          socialProviders: socialProviders,
          alternativeContent: alternativeContent,
          content: mainContent,
        });
      }
    } catch (error) {
      console.error('Error saving:', error);
      // Handle error appropriately
    }
  };

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
      <CardContent className="flex flex-row gap-1">
        <Button
          className="flex-1"
          onClick={handlePostNow}
          disabled={isCreatingPost || isUpdatingPost || isSavingPost}
        >
          {date ? 'Schedule Post' : 'Post Now'}
          {isCreatingPost ? (
            <Loader className="ml-2 size-4 animate-spin" />
          ) : (
            <PiPaperPlaneTiltFill className="size-5" />
          )}
        </Button>
        <Button
          className="flex-1"
          onClick={handleUpdateSavePost}
          disabled={isCreatingPost || isUpdatingPost || isSavingPost}
        >
          {postId ? 'Update Post' : 'Save Post'}
          {isUpdatingPost || isSavingPost ? (
            <Loader className="ml-2 size-4 animate-spin" />
          ) : (
            <FaBookmark className="size-4" />
          )}
        </Button>
      </CardContent>
      <CardContent>
        <SocialSelector />
      </CardContent>
    </Card>
  );
}
