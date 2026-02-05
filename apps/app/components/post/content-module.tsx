'use client';

import { useCallback, useMemo } from 'react';

import { Button } from '@delulu/design-system/components/ui/button';
import { Card } from '@delulu/design-system/components/ui/card';
import { Textarea } from '@delulu/design-system/components/ui/textarea';
import { Icon } from '@delulu/design-system/providers/icon';
import { Remove01Icon, Add01Icon } from '@hugeicons-pro/core-solid-rounded';
import { type SocialType, SocialTypes } from '@delulu/validators/post';

import {
  getDefaultCharacterLimit,
  getDefaultPlaceholder,
  getPlatformsInDefault,
  shouldDefaultUseVideoLayout,
  shouldShowYouTubeTitle,
} from '@/lib/platform-rules';
import { useSelectedSocialProviders, useStore } from '@/store/post';
import { cn } from '@delulu/design-system/lib/utils';
import { useShallow } from 'zustand/shallow';
import { MediaUploader } from './media-uploader';
import { VideoContentLayout } from './video-content-layout';

interface ContentModuleProps {
  socialId: string;
  socialType: SocialType;
}

// This function is no longer used, replaced by dynamic placeholder from default-platform-rules

export function ContentModule({ socialId, socialType }: ContentModuleProps) {
  const { post, setPost } = useStore(
    useShallow((state) => ({
      post: state.post,
      setPost: state.setPost,
    }))
  );
  const selectedSocialProviders = useSelectedSocialProviders();

  const isGlobal = socialType === SocialTypes.DEFAULT;
  const isTwitter = socialType === SocialTypes.TWITTER;

  // Determine which platforms are in default (for intelligent defaults) - memoized
  const platformsInDefault = useMemo(
    () =>
      isGlobal
        ? getPlatformsInDefault(selectedSocialProviders, post.alternativeContent)
        : [],
    [isGlobal, selectedSocialProviders, post.alternativeContent]
  );

  // Determine effective social type for default tab - memoized
  const effectiveSocialType = useMemo(
    () =>
      isGlobal && platformsInDefault.length > 0
        ? platformsInDefault[0] // Use first platform as representative
        : socialType,
    [isGlobal, platformsInDefault, socialType]
  );

  const content = isGlobal
    ? post.content
    : post.alternativeContent.find(
        (item) => item.socialProvider.socialId === socialId
      )?.content || [];

  const handleTextChange = useCallback(
    (text: string, order: number) => {
      if (isGlobal) {
        setPost({
          ...post,
          content: post.content.map((item) =>
            item.order === order ? { ...item, text } : item
          ),
        });
      } else if (socialId) {
        setPost({
          ...post,
          alternativeContent: post.alternativeContent.map((item) =>
            item.socialProvider.socialId === socialId
              ? {
                  ...item,
                  content: item.content.map((contentItem) =>
                    contentItem.order === order
                      ? { ...contentItem, text }
                      : contentItem
                  ),
                }
              : item
          ),
        });
      }
    },
    [isGlobal, post, setPost, socialId]
  );

  const addTweet = useCallback(
    (afterOrder: number) => {
      // Find all tweets after this order and increment their order
      const tweetsToUpdate = content.filter((item) => item.order > afterOrder);
      const newOrder = afterOrder + 1;

      const newTweet = {
        id: '',
        order: newOrder,
        name: isGlobal ? 'DEFAULT' : socialId,
        media: [],
        text: '',
        tags: [],
        socialId: socialId,
      };

      const updatedContent = [
        ...content
          .filter((item) => item.order <= afterOrder)
          .map((item) => ({ ...item })),
        newTweet,
        ...tweetsToUpdate.map((item) => ({
          ...item,
          order: item.order + 1,
        })),
      ].sort((a, b) => a.order - b.order);

      if (isGlobal) {
        setPost({
          ...post,
          content: updatedContent,
        });
      } else {
        setPost({
          ...post,
          alternativeContent: post.alternativeContent.map((item) =>
            item.socialProvider.socialId === socialId
              ? {
                  ...item,
                  content: updatedContent,
                }
              : item
          ),
        });
      }
    },
    [content, isGlobal, post, setPost, socialId]
  );

  const removeTweet = useCallback(
    (order: number) => {
      if (content.length <= 1) {
        return; // Don't remove the last tweet
      }

      // Reorder remaining tweets to ensure sequential order
      const updatedContent = content
        .filter((item) => item.order !== order)
        .map((item, index) => ({
          ...item,
          order: index,
        }))
        .sort((a, b) => a.order - b.order);

      if (isGlobal) {
        setPost({
          ...post,
          content: updatedContent,
        });
      } else {
        setPost({
          ...post,
          alternativeContent: post.alternativeContent.map((item) =>
            item.socialProvider.socialId === socialId
              ? {
                  ...item,
                  content: updatedContent,
                }
              : item
          ),
        });
      }
    },
    [content, isGlobal, post, setPost, socialId]
  );

  const handleThumbnailUpdate = useCallback(
    (
      order: number,
      thumbnail: {
        // For video frame selection: only thumbnailTimestamp (platforms extract the frame)
        // For custom image upload: thumbnailBucketUrl + thumbnailBucketKey
        thumbnailBucketUrl?: string;
        thumbnailBucketKey?: string;
        thumbnailTimestamp?: number; // Timestamp in seconds when video frame was extracted
      }
    ) => {
      // Determine thumbnail type and set fields accordingly:
      // - Video frame: only thumbnailTimestamp (clear URL fields)
      // - Custom image: only URL fields (clear timestamp)
      const isCustomImage = !!thumbnail.thumbnailBucketUrl;
      const thumbnailFields = isCustomImage
        ? {
            thumbnailBucketUrl: thumbnail.thumbnailBucketUrl,
            thumbnailBucketKey: thumbnail.thumbnailBucketKey,
            thumbnailTimestamp: undefined, // Clear timestamp for custom images
          }
        : {
            thumbnailBucketUrl: undefined, // Clear URL for video frames
            thumbnailBucketKey: undefined,
            thumbnailTimestamp: thumbnail.thumbnailTimestamp,
          };

      if (isGlobal) {
        setPost({
          ...post,
          content: post.content.map((item) =>
            item.order === order
              ? {
                  ...item,
                  media: item.media.map((media) =>
                    media.mediaType === 'VIDEO'
                      ? {
                          ...media,
                          ...thumbnailFields,
                        }
                      : media
                  ),
                }
              : item
          ),
        });
      } else {
        setPost({
          ...post,
          alternativeContent: post.alternativeContent.map((item) =>
            item.socialProvider.socialId === socialId
              ? {
                  ...item,
                  content: item.content.map((contentItem) =>
                    contentItem.order === order
                      ? {
                          ...contentItem,
                          media: contentItem.media.map((media) =>
                            media.mediaType === 'VIDEO'
                              ? {
                                  ...media,
                                  ...thumbnailFields,
                                }
                              : media
                          ),
                        }
                      : contentItem
                  ),
                }
              : item
          ),
        });
      }
    },
    [isGlobal, post, setPost, socialId]
  );

  const handleRemoveVideo = useCallback(
    (order: number) => {
      if (isGlobal) {
        setPost({
          ...post,
          content: post.content.map((item) =>
            item.order === order ? { ...item, media: [] } : item
          ),
        });
      } else {
        setPost({
          ...post,
          alternativeContent: post.alternativeContent.map((item) =>
            item.socialProvider.socialId === socialId
              ? {
                  ...item,
                  content: item.content.map((contentItem) =>
                    contentItem.order === order
                      ? { ...contentItem, media: [] }
                      : contentItem
                  ),
                }
              : item
          ),
        });
      }
    },
    [isGlobal, post, setPost, socialId]
  );

  // Check if we should use video-only layout
  const shouldShowVideoLayout = (() => {
    // For DEFAULT tab, check if all platforms in default are video platforms
    if (isGlobal) {
      return shouldDefaultUseVideoLayout(platformsInDefault);
    }

    // TikTok/YouTube: Always show video layout (even without video to guide user)
    if (
      socialType === SocialTypes.TIKTOK ||
      socialType === SocialTypes.YOUTUBE
    ) {
      return true;
    }

    // Instagram: Only show when video exists
    if (socialType === SocialTypes.INSTAGRAM) {
      return (
        content.length > 0 &&
        content[0].media.length > 0 &&
        content[0].media[0].mediaType === 'VIDEO'
      );
    }

    return false;
  })();

  if (shouldShowVideoLayout) {
    // Get video media if it exists, or undefined if not uploaded yet
    const videoMedia =
      content.length > 0 &&
      content[0].media.length > 0 &&
      content[0].media[0].mediaType === 'VIDEO'
        ? content[0].media[0]
        : undefined;

    // Check if we should show YouTube title field
    const showYouTubeTitle = isGlobal
      ? shouldShowYouTubeTitle(platformsInDefault)
      : socialType === SocialTypes.YOUTUBE;

    return (
      <VideoContentLayout
        socialType={effectiveSocialType}
        videoMedia={
          videoMedia as
            | {
                mediaType: 'VIDEO';
                url?: string;
                bucketUrl?: string;
                bucketKey?: string;
                altText?: string;
                thumbnailBucketUrl?: string;
                thumbnailBucketKey?: string;
              }
            | undefined
        }
        text={content[0]?.text || ''}
        title={content[0]?.title}
        onTextChange={(text) => handleTextChange(text, 0)}
        onTitleChange={
          showYouTubeTitle
            ? (title) => {
                if (isGlobal) {
                  setPost({
                    ...post,
                    content: post.content.map((item) =>
                      item.order === 0 ? { ...item, title } : item
                    ),
                  });
                } else {
                  setPost({
                    ...post,
                    alternativeContent: post.alternativeContent.map((item) =>
                      item.socialProvider.socialId === socialId
                        ? {
                            ...item,
                            content: item.content.map((contentItem) =>
                              contentItem.order === 0
                                ? { ...contentItem, title }
                                : contentItem
                            ),
                          }
                        : item
                    ),
                  });
                }
              }
            : undefined
        }
        onThumbnailUpdate={(thumbnail) => handleThumbnailUpdate(0, thumbnail)}
        onRemoveVideo={() => handleRemoveVideo(0)}
        socialId={socialId}
        orderId={0}
        showYouTubeTitle={showYouTubeTitle}
        platformsInDefault={platformsInDefault}
      />
    );
  }

  return (
    <Card className="mt-4 border-none p-4 shadow-sm">
      <div className="space-y-6 border-l-2 border-l-border">
        {content.map((item) => (
          <div key={item.order} className="space-y-4 p-2">
            <div className="relative">
              <Textarea
                value={item.text}
                onChange={(e) => handleTextChange(e.target.value, item.order)}
                placeholder={
                  isGlobal
                    ? getDefaultPlaceholder(platformsInDefault)
                    : socialType === SocialTypes.TWITTER
                      ? "What's happening?"
                      : 'Type your caption here'
                }
                className="min-h-[200px] resize-none border-none shadow-none focus-visible:ring-0"
              />
              {(isTwitter ||
                (isGlobal && getDefaultCharacterLimit(platformsInDefault))) && (
                <div
                  className={cn(
                    'absolute top-2 right-2 text-sm',
                    (() => {
                      const limit = isGlobal
                        ? getDefaultCharacterLimit(platformsInDefault) || 0
                        : 280;
                      return limit - item.text.length < 0
                        ? 'text-destructive'
                        : 'text-muted-foreground';
                    })()
                  )}
                >
                  {(() => {
                    const limit = isGlobal
                      ? getDefaultCharacterLimit(platformsInDefault) || 0
                      : 280;
                    return limit - item.text.length;
                  })()}
                </div>
              )}
              {isTwitter && (
                <div className="absolute right-2 bottom-2 flex items-center gap-2">
                  {content.length > 1 && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeTweet(item.order)}
                    >
                      <Icon icon={Remove01Icon} size={12} />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => addTweet(item.order)}
                  >
                    <Icon icon={Add01Icon} size={12} />
                  </Button>
                </div>
              )}
            </div>
            <div className="relative">
              <MediaUploader
                socialType={socialType}
                socialId={socialId}
                orderId={item.order}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
