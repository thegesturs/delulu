import { useUsageLimit } from '@/hooks/use-usage-limits';
import {
  getProviderSettingsForConvex,
  useDateTime,
  usePost,
  useSelectedSocialProviders,
} from '@/store/post';
import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export function usePostActions() {
  const { date } = useDateTime();
  const post = usePost();
  const socialProviders = useSelectedSocialProviders();
  const providerSettingsForConvex = getProviderSettingsForConvex();
  const { id: postId } = useParams<{ id: string | undefined }>();
  const router = useRouter();

  const upsertPostMutation = useMutation(api.posts.upsertPost);
  const [isProcessing, setIsProcessing] = useState(false);

  const user = useQuery(api.users.current);
  const monthlyPostsCount = user?.usage?.generatedPosts || 0;
  const monthlyPostsLimit = useUsageLimit('monthlyPosts', monthlyPostsCount);
  const isAtPostLimit =
    !monthlyPostsLimit.isUnlimited && !monthlyPostsLimit.allowed;

  const handlePostNow = async () => {
    if (isAtPostLimit) {
      toast.error(
        'You have reached your monthly post limit. Please upgrade your plan.'
      );
      return;
    }

    try {
      setIsProcessing(true);
      await upsertPostMutation({
        ...(postId && { id: postId as Id<'posts'> }),
        content: post.content,
        alternativeContent: post.alternativeContent.map((alt) => ({
          socialProviderId: alt.socialProvider
            .socialId as Id<'socialProviders'>,
          content: alt.content,
        })),
        socialProviderIds: socialProviders.map(
          (sp) => sp.socialId as Id<'socialProviders'>
        ),
        providerSettings: providerSettingsForConvex,
        status: 'PROCESSING',
      });
      toast.success('Post sent for processing, will be published shortly.');
      router.push('/posts?status=PROCESSING');
    } catch {
      toast.error('Failed to publish post');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSchedulePost = async () => {
    if (!date) {
      return;
    }
    if (isAtPostLimit) {
      toast.error(
        'You have reached your monthly post limit. Please upgrade your plan.'
      );
      return;
    }

    try {
      setIsProcessing(true);
      await upsertPostMutation({
        ...(postId && { id: postId as Id<'posts'> }),
        content: post.content,
        alternativeContent: post.alternativeContent.map((alt) => ({
          socialProviderId: alt.socialProvider
            .socialId as Id<'socialProviders'>,
          content: alt.content,
        })),
        socialProviderIds: socialProviders.map(
          (sp) => sp.socialId as Id<'socialProviders'>
        ),
        providerSettings: providerSettingsForConvex,
        scheduledAt: date.getTime(),
        status: 'SCHEDULED',
      });
      toast.success('Post scheduled successfully');
      router.push('/posts?status=SCHEDULED');
    } catch {
      toast.error('Failed to schedule post');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAsDraft = async () => {
    try {
      setIsProcessing(true);
      await upsertPostMutation({
        ...(postId && { id: postId as Id<'posts'> }),
        content: post.content,
        alternativeContent: post.alternativeContent.map((alt) => ({
          socialProviderId: alt.socialProvider
            .socialId as Id<'socialProviders'>,
          content: alt.content,
        })),
        socialProviderIds: socialProviders.map(
          (sp) => sp.socialId as Id<'socialProviders'>
        ),
        providerSettings: providerSettingsForConvex,
        status: 'SAVED',
      });
      toast.success(
        postId ? 'Post updated successfully' : 'Post saved successfully'
      );
      router.push('/posts?status=SAVED');
    } catch {
      toast.error(postId ? 'Failed to update post' : 'Failed to save post');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    handlePostNow,
    handleSchedulePost,
    handleSaveAsDraft,
    isProcessing,
    isAtPostLimit,
    date,
    postId,
  };
}
