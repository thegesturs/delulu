'use client';

import {
  useDateTime,
  usePost,
  useSelectedSocialProviders,
  useStore,
} from '@/store/post';
import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@delulu/design-system/components/ui/accordion';
import { Button } from '@delulu/design-system/components/ui/button';
import { CardContent } from '@delulu/design-system/components/ui/card';
import { NaturalDatePicker } from '@delulu/design-system/components/ui/natural-date-picker';
import { promotionContentTypes } from '@delulu/validators/post';
import { useMutation } from 'convex/react';
import { Loader } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaBookmark } from 'react-icons/fa';
import { PiPaperPlaneTiltFill } from 'react-icons/pi';
import { toast } from 'sonner';
import SocialSelector from './social-selector';
import { TikTokSettings } from './tiktok-settings';

export function BasicSettings() {
  const { date } = useDateTime();
  const post = usePost();
  const setDateAlongWithTime = useStore((state) => state.setDateAlongWithTime);
  const socialProviders = useSelectedSocialProviders();
  const { id: postId } = useParams<{ id: string | undefined }>();
  const router = useRouter();

  // Get TikTok settings from store
  const tiktokSettings = useStore((state) => state.tiktokSettings);

  // Check if TikTok is selected
  const hasTikTokSelected = socialProviders.some(
    (provider) => provider.socialType === 'TIKTOK'
  );

  // Check if we have video content
  const hasVideo = post.content.some((content) =>
    content.media?.some((media) => media.mediaType === 'VIDEO')
  );

  // Single unified mutation for all operations
  const upsertPostMutation = useMutation(api.posts.upsertPost);
  const [isProcessing, setIsProcessing] = useState(false);

  const validateTikTokSettings = () => {
    if (!hasTikTokSelected) {
      return true;
    }

    // Check if settings exist
    if (!tiktokSettings) {
      toast.error('TikTok settings are not initialized');
      return false;
    }

    // Validate privacy is set
    if (!tiktokSettings.privacy) {
      toast.error('Please select a privacy level for TikTok');
      return false;
    }

    // Validate paid partnerships can't be private
    if (
      tiktokSettings.promotionContent === promotionContentTypes.PAID &&
      tiktokSettings.privacy === 'SELF_ONLY'
    ) {
      toast.error('Paid partnerships cannot have privacy set to "Only me"');
      return false;
    }

    return true;
  };

  const handlePostNow = async () => {
    // Validate TikTok settings
    if (!validateTikTokSettings()) {
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
        // Include TikTok settings if TikTok is selected
        ...(hasTikTokSelected && tiktokSettings && { tiktokSettings }),
        // No scheduledAt - immediate publishing via existing tRPC flow
        status: 'PROCESSING',
      });
      toast.success(
        'Post sent for processing, will be published shortly. You can close this window now.'
      );
      router.push('/posts');
    } catch {
      toast.error('Failed to publish post');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler 2: Schedule post for future (scheduledAt = selected date)
  const handleSchedulePost = async () => {
    if (!date) {
      return;
    }

    // Validate TikTok settings
    if (!validateTikTokSettings()) {
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
        // Include TikTok settings if TikTok is selected
        ...(hasTikTokSelected && tiktokSettings && { tiktokSettings }),
        scheduledAt: date.getTime(), // Future scheduling
        status: 'SCHEDULED',
      });
      toast.success('Post scheduled successfully');
      router.push('/posts');
    } catch {
      toast.error('Failed to schedule post');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler 3: Save as draft (no scheduling, regardless of date picker)
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
        // Include TikTok settings if TikTok is selected (save even in drafts)
        ...(hasTikTokSelected && tiktokSettings && { tiktokSettings }),
        status: 'SAVED',
      });
      toast.success(
        postId ? 'Post updated successfully' : 'Post saved successfully'
      );
      router.push('/posts');
    } catch {
      toast.error(postId ? 'Failed to update post' : 'Failed to save post');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="mb-2 block font-medium text-muted-foreground text-sm">
              Schedule
            </div>
            <div className="flex gap-3">
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

      <CardContent className="flex flex-row gap-3 pt-4">
        <Button
          className="flex-1 justify-center gap-2"
          onClick={date ? handleSchedulePost : handlePostNow}
          disabled={isProcessing}
          aria-busy={isProcessing}
        >
          {date ? 'Schedule Post' : 'Post Now'}
          {isProcessing ? (
            <Loader className="size-4 animate-spin" />
          ) : (
            <PiPaperPlaneTiltFill className="size-4" />
          )}
        </Button>
        <Button
          className="flex-1 justify-center gap-2"
          variant="secondary"
          onClick={handleSaveAsDraft}
          disabled={isProcessing}
          aria-busy={isProcessing}
        >
          {postId ? 'Update Post' : 'Save Post'}
          {isProcessing ? (
            <Loader className="size-4 animate-spin" />
          ) : (
            <FaBookmark className="size-4" />
          )}
        </Button>
      </CardContent>

      <CardContent className="pt-4">
        <SocialSelector />
      </CardContent>

      {/* Advanced Settings Accordion */}
      {hasTikTokSelected && (
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="advanced-settings" className="border-none">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-medium text-sm">Advanced Settings</span>
              </AccordionTrigger>
              <AccordionContent>
                <TikTokSettings hasVideo={hasVideo} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      )}
    </>
  );
}
