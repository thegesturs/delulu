import { v } from "convex/values";

// ============================================================================
// ENUMS AND BASIC TYPES
// ============================================================================

export const socialTypeSchema = v.union(
  v.literal("TWITTER"),
  v.literal("LINKEDIN"),
  v.literal("LENS"),
  v.literal("YOUTUBE"),
  v.literal("INSTAGRAM"),
  v.literal("FACEBOOK"),
  v.literal("TIKTOK"),
  v.literal("THREADS"),
  v.literal("PINTEREST"),
  v.literal("FARCASTER"),
  v.literal("BLUESKY"),
  v.literal("DEFAULT")
);

export const postStatusSchema = v.union(
  v.literal("SAVED"),
  v.literal("PUBLISHED"),
  v.literal("SCHEDULED"),
  v.literal("DELETED"),
  v.literal("FAILED"),
  v.literal("PROCESSING")
);

export const POST_STATUS = {
  SAVED: "SAVED",
  PUBLISHED: "PUBLISHED",
  SCHEDULED: "SCHEDULED",
  DELETED: "DELETED",
  FAILED: "FAILED",
  PROCESSING: "PROCESSING",
} as const;

export type PostStatus = (typeof POST_STATUS)[keyof typeof POST_STATUS];

export const postReviewStatusSchema = v.union(
  v.literal("PENDING"),
  v.literal("APPROVED"),
  v.literal("REJECTED")
);

export const privacyStatusSchema = v.union(
  v.literal("PUBLIC"),
  v.literal("PRIVATE"),
  v.literal("UNLISTED")
);

export const mediaTypeSchema = v.union(v.literal("IMAGE"), v.literal("VIDEO"));

// ============================================================================
// MEDIA SCHEMA - Matching validators/post.ts mediaSchema
// ============================================================================

export const mediaSchema = v.object({
  url: v.optional(v.string()),
  mediaType: mediaTypeSchema,
  bucketUrl: v.optional(v.string()),
  bucketKey: v.optional(v.string()),
  altText: v.optional(v.string()),
  thumbnailBucketUrl: v.optional(v.string()),
  thumbnailBucketKey: v.optional(v.string()),
});

// ============================================================================
// CONTENT SCHEMA - Matching validators/post.ts contentSchema EXACTLY
// ============================================================================

export const contentSchema = v.object({
  id: v.optional(v.string()),
  order: v.number(),
  name: v.string(),
  title: v.optional(v.string()),
  media: v.array(mediaSchema),
  text: v.string(),
  tags: v.optional(v.array(v.string())),
  socialId: v.optional(v.string()),
});

// ============================================================================
// ALTERNATIVE CONTENT SCHEMA
// ============================================================================

export const alternativeContentSchema = v.object({
  socialProviderId: v.id("socialProviders"),
  content: v.array(contentSchema),
});

// ============================================================================
// TIKTOK SETTINGS SCHEMA
// ============================================================================

export const tikTokPrivacySchema = v.union(
  v.literal("SELF_ONLY"),
  v.literal("MUTUAL_FOLLOW_FRIENDS"),
  v.literal("PUBLIC_TO_EVERYONE")
);

export const promotionContentSchema = v.union(
  v.literal("NONE"),
  v.literal("SELF"),
  v.literal("PAID")
);

export const tikTokSettingsSchema = v.object({
  privacy: tikTokPrivacySchema,
  allowComments: v.boolean(),
  allowDuet: v.boolean(),
  allowStitch: v.boolean(),
  promotionContent: promotionContentSchema,
});
