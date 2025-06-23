import { File } from 'fetch-blob/file.js';
import { z } from 'zod';

export const videoTypes = ['MP4', 'MOV', 'MKV', 'WEBM'];
export const allowedImageTypes = ['JPEG', 'GIF', 'PNG', 'HEIC', 'WEBP'];

export const allowedImageMimeTypes = new Set([
  'image/jpeg',
  'image/gif',
  'image/png',
]);

export const allowedVideoMimeTypes = new Set([
  'video/mp4',
  'video/quicktime',
  'video/x-matroska',
  'video/webm',
]);

export const SocialTypes = {
  DEFAULT: 'DEFAULT',
  TWITTER: 'TWITTER',
  LINKEDIN: 'LINKEDIN',
  YOUTUBE: 'YOUTUBE',
  INSTAGRAM: 'INSTAGRAM',
  FACEBOOK: 'FACEBOOK',
  TIKTOK: 'TIKTOK',
  LENS: 'LENS',
  THREADS: 'THREADS',
  PINTEREST: 'PINTEREST',
  FARCASTER: 'FARCASTER',
} as const;

export type SocialType = (typeof SocialTypes)[keyof typeof SocialTypes];
export const SocialTypeSchema = z.enum([
  'DEFAULT',
  'TWITTER',
  'LINKEDIN',
  'YOUTUBE',
  'INSTAGRAM',
  'FACEBOOK',
  'TIKTOK',
  'LENS',
  'THREADS',
  'PINTEREST',
  'FARCASTER',
]);

// Implement it later, once basic features are one
export const platformPostSchema = z.object({
  platformPostId: z.string(),
  socialId: z.string(),
  socialType: SocialTypeSchema,
  platformPostUrl: z.string(),
});

export const privacyStatusSchema = z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']);

export const SocialProviderSchema = z.object({
  socialId: z.string(),
  name: z.string(),
  socialType: SocialTypeSchema,
});

export type SocialProviderType = z.infer<typeof SocialProviderSchema>;

export const mediaSchema = z.object({
  url: z.string().optional(),
  mediaType: z.enum(['IMAGE', 'VIDEO']),
  bucketUrl: z.string().optional(),
  bucketKey: z.string().optional(),
  altText: z.string().optional(),
  thumbnailBucketUrl: z.string().optional(),
  thumbnailBucketKey: z.string().optional(),
  file: z.instanceof(File).optional(),
  previewUrl: z.string().optional(),
});

export type MediaType = z.infer<typeof mediaSchema>;

export const getValidMediaUrls = (media: MediaType[]) => {
  return media
    .filter((m) => typeof m.url === 'string' && typeof m.url !== 'undefined')
    .map((m) => {
      return {
        url: m.url,
        mediaType: m.mediaType,
        altText: m.altText,
        thumbnailBucketUrl: m.thumbnailBucketUrl,
        thumbnailBucketKey: m.thumbnailBucketKey,
        bucketUrl: m.bucketUrl,
        bucketKey: m.bucketKey,
      };
    })
    .filter(Boolean);
};

export const contentSchema = z.object({
  id: z.string().optional(),
  order: z.number(),
  name: z.string(),
  media: z.array(mediaSchema),
  text: z.string(),
  tags: z.array(z.string()).optional().default([]),
  socialId: z.string().optional(),
});

export type ContentType = z.infer<typeof contentSchema>;

export const alternativeContentSchema = z.array(
  z.object({
    socialProvider: SocialProviderSchema,
    content: z.array(contentSchema),
  })
);

export type AlternativeContentType = z.infer<typeof alternativeContentSchema>;

export const postSchema = z.object({
  id: z.string().optional(),
  content: z.array(contentSchema),
  alternativeContent: alternativeContentSchema.default([]),
  scheduledTime: z.date().optional(),
  orgId: z.string().optional(),
});

export type FullPostType = z.infer<typeof postSchema>;

export const SocialPublishInputSchema = z.object({
  postId: z.string(),
  socialProviderId: z.string(),
  content: z.array(contentSchema),
});

export type SocialPublishInputType = z.infer<typeof SocialPublishInputSchema>;

const youtubeContentSchema = z.object({
  youtubeId: z.string(),
  name: z.string(),
  thumbnail: z.string(),
  videoUrl: z.string(),
  videoTags: z.array(z.string()),
  videoTitle: z.string(),
  videoDescription: z.string(),
  thumbnailFile: z.instanceof(File).optional(),
  videoFile: z.instanceof(File).optional(),
});

export const finalYoutubeContentSchema = youtubeContentSchema
  .omit({
    thumbnailFile: true,
    videoFile: true,
    youtubeId: true,
  })
  .extend({
    awsRegion: z.string(),
    s3BucketName: z.string(),
    youtubeRefreshToken: z.string(),
  });

export type FinalYoutubeContentType = z.infer<typeof finalYoutubeContentSchema>;

export type youtubeContentType = z.infer<typeof youtubeContentSchema>;

export const savePostInputSchema = z.object({
  ...postSchema.shape,
  content: z.array(
    contentSchema.extend({
      media: z.array(
        mediaSchema.omit({
          file: true,
          previewUrl: true,
        })
      ),
    })
  ),
  alternativeContent: z.array(
    z.object({
      socialProvider: SocialProviderSchema,
      content: z.array(
        contentSchema.extend({
          media: z.array(
            mediaSchema.omit({
              file: true,
              previewUrl: true,
            })
          ),
        })
      ),
    })
  ),
  socialProviders: z.array(SocialProviderSchema),
});

export type SavePostInputType = z.infer<typeof savePostInputSchema>;

export const updatePostInputSchema = z.object({
  ...savePostInputSchema.shape,
  postId: z.string(),
});

export type UpdatePostInput = z.infer<typeof updatePostInputSchema>;

export const YoutubeContentType = z.object({
  id: z.string(),
  YoutubeTokenId: z.string(),
  postId: z.string(),
  videoTags: z.array(z.string()),
  title: z.string(),
  description: z.string(),
  thumbnail: z.string(),
  video: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  orgId: z.string().optional(),
});

export const updateYoutubePostSchema = YoutubeContentType.partial().extend({
  content: z.array(postSchema),
});

export type UpdateYoutubePostInput = z.infer<typeof updateYoutubePostSchema>;

export const postTweetInputSchema = z.object({
  tokenId: z.string(),
  tweets: z.array(contentSchema),
});

export type PostTweetInput = z.infer<typeof postTweetInputSchema>;

export const postToLinkedInInputSchema = z.object({
  socialId: z.string(),
  content: z.array(contentSchema.extend({ media: z.array(mediaSchema) })),
  postId: z.string(),
});

export type PostToLinkedInInput = z.infer<typeof postToLinkedInInputSchema>;

export function getFileType(url: string): 'image' | 'video' | 'unknown' {
  const extension = url.split('.').pop()?.toUpperCase();
  if (extension) {
    if (allowedImageTypes.includes(extension)) {
      return 'image';
    }
    if (videoTypes.includes(extension)) {
      return 'video';
    }
  }
  return 'unknown';
}

export const postReturnSchema = z.object({
  platformPostId: z.string(),
  postId: z.string(),
  platformId: z.string(),
  platformPostUrl: z.string(),
  postedAt: z.date(),
});

export type PostReturnType = z.infer<typeof postReturnSchema>;
