'use client';

import { useCallback } from 'react';

import { Button } from '@delulu/design-system/components/ui/button';
import { Card } from '@delulu/design-system/components/ui/card';
import { Textarea } from '@delulu/design-system/components/ui/textarea';
import { type SocialType, SocialTypes } from '@delulu/validators/post';
import { Minus, Plus } from 'lucide-react';

import { useStore } from '@/store/post';
import { cn } from '@delulu/design-system/lib/utils';
import { useShallow } from 'zustand/shallow';
import { MediaUploader } from './media-uploader';

interface ContentModuleProps {
  socialId: string;
  socialType: SocialType;
}

function getPlaceholder(socialType: SocialType) {
  if (socialType === SocialTypes.TWITTER) {
    return "What's on your mind?";
  }
  if (socialType === SocialTypes.INSTAGRAM) {
    return 'Type your caption here';
  }
  if (socialType === SocialTypes.TIKTOK) {
    return 'Type your caption here';
  }
  if (socialType === SocialTypes.YOUTUBE) {
    return 'Type your caption here';
  }
  return "What's on your mind?";
}

export function ContentModule({ socialId, socialType }: ContentModuleProps) {
  const { post, setPost } = useStore(
    useShallow((state) => ({
      post: state.post,
      setPost: state.setPost,
    }))
  );

  const isGlobal = socialType === SocialTypes.DEFAULT;
  const isTwitter = socialType === SocialTypes.TWITTER;

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
      if (content.length <= 1) return; // Don't remove the last tweet

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
    [content.length, isGlobal, post, setPost, socialId]
  );

  return (
    <Card className="mt-4 border-none p-4 shadow-sm">
      <div className="space-y-6 border-l-2 border-l-border">
        {content.map((item) => (
          <div key={item.order} className="space-y-4 p-2">
            <div className="relative">
              <Textarea
                value={item.text}
                onChange={(e) => handleTextChange(e.target.value, item.order)}
                placeholder={getPlaceholder(socialType)}
                className="min-h-[200px] resize-none border-none shadow-none focus-visible:ring-0"
              />
              {isTwitter && (
                <div
                  className={cn(
                    'absolute top-2 right-2 text-sm',
                    280 - item.text.length < 0
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  )}
                >
                  {280 - item.text.length}
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
                      <Minus className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => addTweet(item.order)}
                  >
                    <Plus className="h-3 w-3" />
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
