"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { Card } from "@delulu/design-system/components/ui/card";
import { Textarea } from "@delulu/design-system/components/ui/textarea";
import { cn } from "@delulu/design-system/lib/utils";
import { Icon } from "@delulu/design-system/providers/icon";
import { type SocialType, SocialTypes } from "@delulu/validators/post";
import { Add01Icon, Remove01Icon } from "@hugeicons-pro/core-solid-rounded";
import { useCallback, useMemo, useRef } from "react";
import { useShallow } from "zustand/shallow";
import {
  getDefaultCharacterLimit,
  getDefaultPlaceholder,
  getPlatformsInDefault,
  shouldDefaultUseVideoLayout,
  shouldShowYouTubeTitle,
} from "@/lib/platform-rules";
import {
  useIsMediaUploading,
  useSelectedSocialProviders,
  useStore,
} from "@/store/post";
import { MediaUploader } from "./media-uploader";
import { VideoContentLayout } from "./video-content-layout";

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
  const isMediaUploading = useIsMediaUploading();

  const isGlobal = socialType === SocialTypes.DEFAULT;
  const isTwitter = socialType === SocialTypes.TWITTER;

  // Determine which platforms are in default (for intelligent defaults) - memoized
  const platformsInDefault = useMemo(
    () =>
      isGlobal
        ? getPlatformsInDefault(
            selectedSocialProviders,
            post.alternativeContent
          )
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
        setPost((currentPost) => ({
          ...currentPost,
          content: currentPost.content.map((item) =>
            item.order === order ? { ...item, text } : item
          ),
        }));
      } else if (socialId) {
        setPost((currentPost) => ({
          ...currentPost,
          alternativeContent: currentPost.alternativeContent.map((item) =>
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
        }));
      }
    },
    [isGlobal, setPost, socialId]
  );

  const addTweet = useCallback(
    (afterOrder: number) => {
      const newOrder = afterOrder + 1;

      const newTweet = {
        id: "",
        order: newOrder,
        name: isGlobal ? "DEFAULT" : socialId,
        media: [],
        text: "",
        tags: [],
        socialId,
      };

      if (isGlobal) {
        setPost((currentPost) => {
          const currentContent = currentPost.content;
          const updatedContent = [
            ...currentContent
              .filter((item) => item.order <= afterOrder)
              .map((item) => ({ ...item })),
            newTweet,
            ...currentContent
              .filter((item) => item.order > afterOrder)
              .map((item) => ({ ...item, order: item.order + 1 })),
          ].sort((a, b) => a.order - b.order);
          return { ...currentPost, content: updatedContent };
        });
      } else {
        setPost((currentPost) => ({
          ...currentPost,
          alternativeContent: currentPost.alternativeContent.map((item) => {
            if (item.socialProvider.socialId !== socialId) {
              return item;
            }
            const currentContent = item.content;
            const updatedContent = [
              ...currentContent
                .filter((c) => c.order <= afterOrder)
                .map((c) => ({ ...c })),
              newTweet,
              ...currentContent
                .filter((c) => c.order > afterOrder)
                .map((c) => ({ ...c, order: c.order + 1 })),
            ].sort((a, b) => a.order - b.order);
            return { ...item, content: updatedContent };
          }),
        }));
      }
    },
    [isGlobal, setPost, socialId]
  );

  const removeTweet = useCallback(
    (order: number) => {
      const reorder = (items: typeof content) => {
        if (items.length <= 1) {
          return items; // Don't remove the last tweet
        }
        return items
          .filter((item) => item.order !== order)
          .map((item, index) => ({ ...item, order: index }))
          .sort((a, b) => a.order - b.order);
      };

      if (isGlobal) {
        setPost((currentPost) => {
          const updatedContent = reorder(currentPost.content);
          if (updatedContent.length === currentPost.content.length) {
            return currentPost;
          }
          return { ...currentPost, content: updatedContent };
        });
      } else {
        setPost((currentPost) => ({
          ...currentPost,
          alternativeContent: currentPost.alternativeContent.map((item) => {
            if (item.socialProvider.socialId !== socialId) {
              return item;
            }
            const updatedContent = reorder(item.content);
            if (updatedContent.length === item.content.length) {
              return item;
            }
            return { ...item, content: updatedContent };
          }),
        }));
      }
    },
    [isGlobal, setPost, socialId]
  );

  const handleThumbnailUpdate = useCallback(
    (
      order: number,
      thumbnail: {
        thumbnailBucketUrl?: string;
        thumbnailBucketKey?: string;
        thumbnailTimestamp?: number;
      }
    ) => {
      const isCustomImage = !!thumbnail.thumbnailBucketUrl;
      const thumbnailFields = isCustomImage
        ? {
            thumbnailBucketUrl: thumbnail.thumbnailBucketUrl,
            thumbnailBucketKey: thumbnail.thumbnailBucketKey,
            thumbnailTimestamp: undefined,
          }
        : {
            thumbnailBucketUrl: undefined,
            thumbnailBucketKey: undefined,
            thumbnailTimestamp: thumbnail.thumbnailTimestamp,
          };

      const applyThumbnail = <T extends { mediaType: string }>(media: T[]) =>
        media.map((m) =>
          m.mediaType === "VIDEO" ? { ...m, ...thumbnailFields } : m
        );

      if (isGlobal) {
        setPost((currentPost) => ({
          ...currentPost,
          content: currentPost.content.map((item) =>
            item.order === order
              ? { ...item, media: applyThumbnail(item.media) }
              : item
          ),
        }));
      } else {
        setPost((currentPost) => ({
          ...currentPost,
          alternativeContent: currentPost.alternativeContent.map((item) =>
            item.socialProvider.socialId === socialId
              ? {
                  ...item,
                  content: item.content.map((contentItem) =>
                    contentItem.order === order
                      ? {
                          ...contentItem,
                          media: applyThumbnail(contentItem.media),
                        }
                      : contentItem
                  ),
                }
              : item
          ),
        }));
      }
    },
    [isGlobal, setPost, socialId]
  );

  const handleRemoveVideo = useCallback(
    (order: number) => {
      if (isGlobal) {
        setPost((currentPost) => ({
          ...currentPost,
          content: currentPost.content.map((item) =>
            item.order === order ? { ...item, media: [] } : item
          ),
        }));
      } else {
        setPost((currentPost) => ({
          ...currentPost,
          alternativeContent: currentPost.alternativeContent.map((item) =>
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
        }));
      }
    },
    [isGlobal, setPost, socialId]
  );

  // Freeze layout during upload to prevent destroying MediaUploader state
  const frozenLayoutRef = useRef<boolean | null>(null);

  const shouldShowVideoLayout = (() => {
    const hasVideoInContent =
      content.length > 0 &&
      content[0].media.length > 0 &&
      content[0].media[0].mediaType === "VIDEO";

    // Compute what the layout WOULD be based on platform type or uploaded video
    const computedLayout = (() => {
      if (hasVideoInContent) {
        return true;
      }
      if (isGlobal) {
        return shouldDefaultUseVideoLayout(platformsInDefault);
      }
      if (
        socialType === SocialTypes.TIKTOK ||
        socialType === SocialTypes.YOUTUBE
      ) {
        return true;
      }
      return false;
    })();

    // While uploading, freeze layout to whatever it was when upload started
    if (isMediaUploading) {
      if (frozenLayoutRef.current === null) {
        frozenLayoutRef.current = computedLayout;
      }
      return frozenLayoutRef.current;
    }

    // Not uploading — clear freeze and use computed value
    frozenLayoutRef.current = null;
    return computedLayout;
  })();

  if (shouldShowVideoLayout) {
    // Get video media if it exists, or undefined if not uploaded yet
    const videoMedia =
      content.length > 0 &&
      content[0].media.length > 0 &&
      content[0].media[0].mediaType === "VIDEO"
        ? content[0].media[0]
        : undefined;

    // Check if we should show YouTube title field
    const showYouTubeTitle = isGlobal
      ? shouldShowYouTubeTitle(platformsInDefault)
      : socialType === SocialTypes.YOUTUBE;

    return (
      <VideoContentLayout
        onRemoveVideo={() => handleRemoveVideo(0)}
        onTextChange={(text) => handleTextChange(text, 0)}
        onThumbnailUpdate={(thumbnail) => handleThumbnailUpdate(0, thumbnail)}
        onTitleChange={
          showYouTubeTitle
            ? (title) => {
                if (isGlobal) {
                  setPost((currentPost) => ({
                    ...currentPost,
                    content: currentPost.content.map((item) =>
                      item.order === 0 ? { ...item, title } : item
                    ),
                  }));
                } else {
                  setPost((currentPost) => ({
                    ...currentPost,
                    alternativeContent: currentPost.alternativeContent.map(
                      (item) =>
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
                  }));
                }
              }
            : undefined
        }
        orderId={0}
        platformsInDefault={platformsInDefault}
        showYouTubeTitle={showYouTubeTitle}
        socialId={socialId}
        socialType={effectiveSocialType}
        text={content[0]?.text || ""}
        title={content[0]?.title}
        videoMedia={
          videoMedia as
            | {
                mediaType: "VIDEO";
                url?: string;
                bucketUrl?: string;
                bucketKey?: string;
                altText?: string;
                thumbnailBucketUrl?: string;
                thumbnailBucketKey?: string;
                thumbnailTimestamp?: number;
              }
            | undefined
        }
      />
    );
  }

  return (
    <Card className="mt-4 max-h-[calc(100vh-220px)] overflow-y-auto border-none p-4 shadow-sm">
      <div className="space-y-6 border-l-2 border-l-border">
        {content.map((item) => (
          <div className="space-y-4 p-2" key={item.order}>
            <div className="relative">
              <Textarea
                className="min-h-[200px] resize-none border-none shadow-none focus-visible:ring-0"
                onChange={(e) => handleTextChange(e.target.value, item.order)}
                placeholder={
                  isGlobal
                    ? getDefaultPlaceholder(platformsInDefault)
                    : socialType === SocialTypes.TWITTER
                      ? "What's happening?"
                      : "Type your caption here"
                }
                value={item.text}
              />
              {(isTwitter ||
                (isGlobal && getDefaultCharacterLimit(platformsInDefault))) && (
                <div
                  className={cn(
                    "absolute top-2 right-2 text-sm",
                    (() => {
                      const limit = isGlobal
                        ? getDefaultCharacterLimit(platformsInDefault) || 0
                        : 280;
                      return limit - item.text.length < 0
                        ? "text-destructive"
                        : "text-muted-foreground";
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
                      className="h-6 w-6"
                      onClick={() => removeTweet(item.order)}
                      size="icon"
                      variant="destructive"
                    >
                      <Icon icon={Remove01Icon} size={12} />
                    </Button>
                  )}
                  <Button
                    className="h-6 w-6"
                    onClick={() => addTweet(item.order)}
                    size="icon"
                  >
                    <Icon icon={Add01Icon} size={12} />
                  </Button>
                </div>
              )}
            </div>
            <div className="relative">
              <MediaUploader
                orderId={item.order}
                socialId={socialId}
                socialType={effectiveSocialType}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
