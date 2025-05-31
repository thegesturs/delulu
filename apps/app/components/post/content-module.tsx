'use client';

import { useCallback } from 'react';

import { Button } from '@delulu/design-system/components/ui/button';
import { Card } from '@delulu/design-system/components/ui/card';
import { Textarea } from '@delulu/design-system/components/ui/textarea';
import { type SocialType, SocialTypes } from '@delulu/validators/post';
import { Minus, Plus } from 'lucide-react';

import { useStore } from '@/store/post';
import { useShallow } from 'zustand/shallow';
import { MediaUploader } from './media-uploader';

interface ContentModuleProps {
  socialId: string;
  socialType: SocialType;
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

  const addTweet = useCallback(() => {
    const newOrder = Math.max(...content.map((item) => item.order), -1) + 1;
    const newTweet = {
      id: '',
      order: newOrder,
      name: isGlobal ? 'DEFAULT' : socialId,
      media: [],
      text: '',
      tags: [],
      socialId: socialId,
    };

    if (isGlobal) {
      setPost({
        ...post,
        content: [...post.content, newTweet],
      });
    } else {
      setPost({
        ...post,
        alternativeContent: post.alternativeContent.map((item) =>
          item.socialProvider.socialId === socialId
            ? {
                ...item,
                content: [...item.content, newTweet],
              }
            : item
        ),
      });
    }
  }, [content, isGlobal, post, setPost, socialId]);

  const removeTweet = useCallback(
    (order: number) => {
      if (content.length <= 1) return; // Don't remove the last tweet

      if (isGlobal) {
        setPost({
          ...post,
          content: post.content.filter((item) => item.order !== order),
        });
      } else {
        setPost({
          ...post,
          alternativeContent: post.alternativeContent.map((item) =>
            item.socialProvider.socialId === socialId
              ? {
                  ...item,
                  content: item.content.filter(
                    (contentItem) => contentItem.order !== order
                  ),
                }
              : item
          ),
        });
      }
    },
    [content.length, isGlobal, post, setPost, socialId]
  );

  return (
    <div className="space-y-6">
      {content.map((item) => (
        <Card key={item.order} className="border-none p-4 shadow-sm">
          <div className="relative">
            <Textarea
              value={item.text}
              onChange={(e) => handleTextChange(e.target.value, item.order)}
              placeholder="What's on your mind?"
              className="mb-4 min-h-[100px] resize-none border-none shadow-none focus-visible:ring-0"
            />
            {isTwitter && (
              <div className="absolute top-2 right-2 text-muted-foreground text-sm">
                {280 - item.text.length}
              </div>
            )}
          </div>
          <MediaUploader
            socialType={socialType}
            socialId={socialId}
            orderId={item.order}
          />
          {isTwitter && content.length > 1 && (
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="destructive"
                size="icon"
                onClick={() => removeTweet(item.order)}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>
      ))}
      {isTwitter && (
        <div className="flex justify-end">
          <Button onClick={addTweet} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
