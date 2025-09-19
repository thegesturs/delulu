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
  BLUESKY: 'BLUESKY',
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
  'BLUESKY',
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
  title: z.string().optional(),
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

export const savePostInputSchema = z.object({
  ...postSchema.shape,
  content: z.array(contentSchema),
  alternativeContent: z.array(
    z.object({
      socialProvider: SocialProviderSchema,
      content: z.array(contentSchema),
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

export const tikTokPrivacyLevels = {
  SELF_ONLY: 'SELF_ONLY',
  MUTUAL_FOLLOW_FRIENDS: 'MUTUAL_FOLLOW_FRIENDS',
  PUBLIC_TO_EVERYONE: 'PUBLIC_TO_EVERYONE',
} as const;

export type TiktokPrivacyLevels =
  (typeof tikTokPrivacyLevels)[keyof typeof tikTokPrivacyLevels];

// Extract values as readonly tuple for Zod enum
const tikTokPrivacyValues = [
  tikTokPrivacyLevels.SELF_ONLY,
  tikTokPrivacyLevels.MUTUAL_FOLLOW_FRIENDS,
  tikTokPrivacyLevels.PUBLIC_TO_EVERYONE,
] as const;

export const promotionContentTypes = {
  NONE: 'NONE',
  SELF: 'SELF',
  PAID: 'PAID',
} as const;

export type PromotionContentType =
  (typeof promotionContentTypes)[keyof typeof promotionContentTypes];

// Extract values as readonly tuple for Zod enum
const promotionContentValues = [
  promotionContentTypes.NONE,
  promotionContentTypes.SELF,
  promotionContentTypes.PAID,
] as const;

// TikTok Settings Schema - simplified with single promotion field
export const tikTokSettingsSchema = z
  .object({
    privacy: z.enum(tikTokPrivacyValues),
    allowComments: z.boolean().default(true),
    allowDuet: z.boolean().default(false),
    allowStitch: z.boolean().default(false),
    promotionContent: z.enum(promotionContentValues).default('NONE'),
  })
  .refine(
    (data) => {
      // Paid partnerships cannot have privacy level "SELF_ONLY"
      if (data.promotionContent === 'PAID' && data.privacy === 'SELF_ONLY') {
        return false;
      }
      return true;
    },
    {
      message: "Paid partnerships cannot have privacy level set to 'Only me'",
    }
  );

export type TikTokSettings = z.infer<typeof tikTokSettingsSchema>;

// Provider-specific settings types
export type YouTubeSettings = {
  privacy: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  madeForKids: boolean;
  ageRestriction?: boolean;
};

export type InstagramSettings = {
  shareToFeed: boolean;
  shareToStory: boolean;
  shareToReels: boolean;
};

export type FacebookSettings = {
  privacy: 'PUBLIC' | 'FRIENDS' | 'ONLY_ME';
};

export type TwitterSettings = {
  replyRestriction: 'everyone' | 'following' | 'mentioned';
};

export type LinkedInSettings = {
  visibility: 'PUBLIC' | 'CONNECTIONS';
};

export type ThreadsSettings = {
  replyControl: 'everyone' | 'following' | 'mentioned';
};

export type PinterestSettings = {
  boardId?: string;
};

export type FarcasterSettings = {
  channelId?: string;
};

export type BlueskySettings = {
  replyDisabled?: boolean;
};

// Simple discriminated union for provider settings
export type ProviderSetting =
  | {
      socialProviderId: string;
      type: typeof SocialTypes.TIKTOK;
      settings: TikTokSettings;
    }
  | {
      socialProviderId: string;
      type: typeof SocialTypes.YOUTUBE;
      settings: YouTubeSettings;
    }
  | {
      socialProviderId: string;
      type: typeof SocialTypes.INSTAGRAM;
      settings: InstagramSettings;
    }
  | {
      socialProviderId: string;
      type: typeof SocialTypes.FACEBOOK;
      settings: FacebookSettings;
    }
  | {
      socialProviderId: string;
      type: typeof SocialTypes.TWITTER;
      settings: TwitterSettings;
    }
  | {
      socialProviderId: string;
      type: typeof SocialTypes.LINKEDIN;
      settings: LinkedInSettings;
    }
  | {
      socialProviderId: string;
      type: typeof SocialTypes.THREADS;
      settings: ThreadsSettings;
    }
  | {
      socialProviderId: string;
      type: typeof SocialTypes.PINTEREST;
      settings: PinterestSettings;
    }
  | {
      socialProviderId: string;
      type: typeof SocialTypes.FARCASTER;
      settings: FarcasterSettings;
    }
  | {
      socialProviderId: string;
      type: typeof SocialTypes.BLUESKY;
      settings: BlueskySettings;
    }
  | {
      socialProviderId: string;
      type: typeof SocialTypes.DEFAULT;
      settings: Record<string, never>;
    }
  | {
      socialProviderId: string;
      type: typeof SocialTypes.LENS;
      settings: Record<string, never>;
    };

// Zod schema for provider settings (for validation)
export const providerSettingSchema = z.discriminatedUnion('type', [
  z.object({
    socialProviderId: z.string(),
    type: z.literal(SocialTypes.TIKTOK),
    settings: tikTokSettingsSchema,
  }),
  z.object({
    socialProviderId: z.string(),
    type: z.literal(SocialTypes.YOUTUBE),
    settings: z.object({
      privacy: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']),
      madeForKids: z.boolean(),
      ageRestriction: z.boolean().optional(),
    }),
  }),
]);
