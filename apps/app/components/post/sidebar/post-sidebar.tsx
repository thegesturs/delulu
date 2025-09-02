'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@delulu/design-system/components/ui/accordion';
import { Button } from '@delulu/design-system/components/ui/button';
import { Card, CardContent } from '@delulu/design-system/components/ui/card';

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
import SocialSelector from './social-selector';
import { TikTokSettings } from './tiktok-settings';

export function PostSidebar() {
  const { date } = useDateTime(); // We only need date, as it will contain time
  const post = usePost();
  const setDateAlongWithTime = useStore((state) => state.setDateAlongWithTime); // Get the action
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

  // Handler 1: Post immediately (no scheduledAt = immediate publishing via tRPC)
  const handlePostNow = async () => {
    // Validate TikTok settings if TikTok is selected
    if (hasTikTokSelected) {
      if (!tiktokSettings?.privacy) {
        toast.error('Please select a privacy level for TikTok');
        return;
      }
      if (
        tiktokSettings?.commercialContent &&
        !tiktokSettings?.yourBrand &&
        !tiktokSettings?.brandedContent
      ) {
        toast.error('Please select at least one commercial content option');
        return;
      }
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
        ...(hasTikTokSelected &&
          tiktokSettings && {
            tiktokSettings: {
              ...tiktokSettings,
              privacy: tiktokSettings.privacy,
            },
          }),
        // No scheduledAt - immediate publishing via existing tRPC flow
        status: 'SAVED', // Will be published immediately through different flow
      });
      toast.success(
        'Post sent for processing, will be published shortly. You can close this window now.'
      );
      router.push('/posts');
    } catch (error) {
      toast.error('Failed to publish post');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler 2: Schedule post for future (scheduledAt = selected date)
  const handleSchedulePost = async () => {
    if (!date) return;

    // Validate TikTok settings if TikTok is selected
    if (hasTikTokSelected) {
      if (!tiktokSettings?.privacy) {
        toast.error('Please select a privacy level for TikTok');
        return;
      }
      if (
        tiktokSettings?.commercialContent &&
        !tiktokSettings?.yourBrand &&
        !tiktokSettings?.brandedContent
      ) {
        toast.error('Please select at least one commercial content option');
        return;
      }
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
        ...(hasTikTokSelected &&
          tiktokSettings && {
            tiktokSettings: {
              ...tiktokSettings,
              privacy: tiktokSettings.privacy,
            },
          }),
        scheduledAt: date.getTime(), // Future scheduling
        status: 'SCHEDULED',
      });
      toast.success('Post scheduled successfully');
      router.push('/posts');
    } catch (error) {
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
        ...(hasTikTokSelected &&
          tiktokSettings && {
            tiktokSettings: {
              ...tiktokSettings,
              privacy: tiktokSettings.privacy,
            },
          }),
        status: 'SAVED',
      });
      toast.success(
        postId ? 'Post updated successfully' : 'Post saved successfully'
      );
      router.push('/posts');
    } catch (error) {
      toast.error(postId ? 'Failed to update post' : 'Failed to save post');
    } finally {
      setIsProcessing(false);
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
          onClick={date ? handleSchedulePost : handlePostNow}
          disabled={isProcessing}
        >
          {date ? 'Schedule Post' : 'Post Now'}
          {isProcessing ? (
            <Loader className="ml-2 size-4 animate-spin" />
          ) : (
            <PiPaperPlaneTiltFill className="size-5" />
          )}
        </Button>
        <Button
          className="flex-1"
          onClick={handleSaveAsDraft}
          disabled={isProcessing}
        >
          {postId ? 'Update Post' : 'Save Post'}
          {isProcessing ? (
            <Loader className="ml-2 size-4 animate-spin" />
          ) : (
            <FaBookmark className="size-4" />
          )}
        </Button>
      </CardContent>
      <CardContent>
        <SocialSelector />
      </CardContent>

      {/* Advanced Settings Accordion */}
      {hasTikTokSelected && (
        <CardContent className="border-t">
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
    </Card>
  );
}
