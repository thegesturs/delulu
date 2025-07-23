'use client';

import { Button } from '@delulu/design-system/components/ui/button';
import { Card, CardContent } from '@delulu/design-system/components/ui/card';

import { useCreatePost } from '@/hooks/use-social-providers';
import {
  useDateTime,
  usePost,
  useSelectedSocialProviders,
  useStore,
} from '@/store/post';
import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { NaturalDatePicker } from '@delulu/design-system/components/ui/natural-date-picker';
import { useMutation } from 'convex/react';
import { Loader } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
  const { postId } = useParams<{ postId: string | undefined }>();
  const router = useRouter();

  const publishPostMutation = useCreatePost({
    onSuccess: () => {
      toast.success('Post created successfully');
      router.push('/posts');
    },
    onError: () => {
      toast.error('Failed to create post');
    },
  });

  const updatePost = useMutation(api.posts.updatePost);
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);

  const createPostMutation = useMutation(api.posts.createPost);
  const [isSavingPost, setIsSavingPost] = useState(false);

  const handlePostNow = () => {
    publishPostMutation.mutate({
      content: post.content,
      socialProviders: socialProviders,
      alternativeContent: post.alternativeContent,
    });
  };

  const handleUpdateSavePost = async () => {
    try {
      // First upload all media files
      const { mainContent, alternativeContent } = await uploadAllContentMedia(
        post.content,
        post.alternativeContent
      );

      if (postId) {
        setIsUpdatingPost(true);
        await updatePost({
          id: postId as Id<'posts'>,
          content: mainContent,
          alternativeContent: alternativeContent.map((alt) => ({
            socialProviderId: alt.socialProvider
              .socialId as Id<'socialProviders'>,
            content: alt.content,
          })),
          socialProviderIds: socialProviders.map(
            (sp) => sp.socialId as Id<'socialProviders'>
          ),
        });
        toast.success('Post updated successfully');
        router.push('/posts');
      } else {
        setIsSavingPost(true);
        await createPostMutation({
          content: mainContent,
          alternativeContent: alternativeContent.map((alt) => ({
            socialProviderId: alt.socialProvider
              .socialId as Id<'socialProviders'>,
            content: alt.content,
          })),
          socialProviderIds: socialProviders.map(
            (sp) => sp.socialId as Id<'socialProviders'>
          ),
          status: 'SAVED',
        });
        toast.success('Post saved successfully');
        router.push('/posts');
      }
    } catch (error) {
      toast.error(postId ? 'Failed to update post' : 'Failed to save post');
    } finally {
      setIsUpdatingPost(false);
      setIsSavingPost(false);
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
          disabled={
            publishPostMutation.isPending || isUpdatingPost || isSavingPost
          }
        >
          {date ? 'Schedule Post' : 'Post Now'}
          {publishPostMutation.isPending ? (
            <Loader className="ml-2 size-4 animate-spin" />
          ) : (
            <PiPaperPlaneTiltFill className="size-5" />
          )}
        </Button>
        <Button
          className="flex-1"
          onClick={handleUpdateSavePost}
          disabled={
            publishPostMutation.isPending || isUpdatingPost || isSavingPost
          }
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
