'use client';

import { useCallback } from 'react';

import { Card } from '@delulu/design-system/components/ui/card';
import { Textarea } from '@delulu/design-system/components/ui/textarea';
import type { MediaType, SocialType } from '@delulu/validators/post';

import { useStore } from '@/store/post';
import { useShallow } from 'zustand/shallow';
import { MediaUploader } from './media-uploader';

interface ContentModuleProps {
  isGlobal?: boolean;
  socialId?: string;
  socialType?: SocialType;
}

export function ContentModule({
  isGlobal = false,
  socialId,
  socialType,
}: ContentModuleProps) {
  const { post, setPost } = useStore(
    useShallow((state) => ({
      post: state.post,
      setPost: state.setPost,
    }))
  );

  const content = isGlobal
    ? post.content[0]
    : post.alternativeContent.find(
        (item) => item.socialProvider.socialId === socialId
      )?.content[0];

  const handleTextChange = useCallback(
    (text: string) => {
      if (isGlobal) {
        setPost({
          ...post,
          content: [{ ...post.content[0], text }],
        });
      } else if (socialId) {
        setPost({
          ...post,
          alternativeContent: post.alternativeContent.map((item) =>
            item.socialProvider.socialId === socialId
              ? {
                  ...item,
                  content: [{ ...item.content[0], text }],
                }
              : item
          ),
        });
      }
    },
    [isGlobal, post, setPost, socialId]
  );

  const handleMediaChange = useCallback(
    (media: MediaType[]) => {
      if (isGlobal) {
        setPost({
          ...post,
          content: [{ ...post.content[0], media }],
        });
      } else if (socialId) {
        setPost({
          ...post,
          alternativeContent: post.alternativeContent.map((item) =>
            item.socialProvider.socialId === socialId
              ? {
                  ...item,
                  content: [{ ...item.content[0], media }],
                }
              : item
          ),
        });
      }
    },
    [isGlobal, post, setPost, socialId]
  );

  if (!content) {
    return null;
  }

  return (
    <Card className="mt-4 border-none p-4 shadow-sm">
      <Textarea
        value={content.text}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="What's on your mind?"
        className="mb-4 min-h-[200px] resize-none border-none shadow-none focus-visible:ring-0"
      />
      <MediaUploader
        media={content.media}
        onChange={handleMediaChange}
        socialType={socialType}
      />
    </Card>
  );
}
