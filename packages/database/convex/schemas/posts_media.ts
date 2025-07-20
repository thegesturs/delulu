import { type Infer, v } from 'convex/values';
import {
  alternativeContentSchema,
  contentSchema,
  mediaTypeSchema,
  postReviewStatusSchema,
  postStatusSchema,
  privacyStatusSchema,
} from './enums';
import { socialProviderSchema } from './social_providers';

// ============================================================================
// PLATFORM POSTS SCHEMAS (Embedded in Posts)
// ============================================================================

export const embeddedPlatformPostSchema = v.object({
  socialProviderId: v.id('socialProviders'),
  platformPostId: v.optional(v.string()),
  platformPostUrl: v.optional(v.string()),
  postedAt: v.optional(v.number()),
  failureReason: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

// ============================================================================
// POST SCHEMAS
// ============================================================================

// Base post schema without system fields
export const basePostSchema = v.object({
  userId: v.optional(v.id('users')),
  status: postStatusSchema,
  scheduledAt: v.optional(v.number()),
  reviewStatus: postReviewStatusSchema,
  organizationId: v.optional(v.string()),
  isDeleted: v.boolean(),
  postFailureReason: v.optional(v.string()),
  privacyStatus: privacyStatusSchema,
  content: v.array(contentSchema),
  alternativeContent: v.optional(v.array(alternativeContentSchema)),
  socialProviderIds: v.array(v.id('socialProviders')),
  platformPosts: v.optional(v.array(embeddedPlatformPostSchema)),
  searchableText: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  publishedAt: v.optional(v.number()),
  lastFailedAt: v.optional(v.number()),
  retryCount: v.number(),
});

// Post schema with system fields (for returns)
export const postSchema = v.object({
  _id: v.id('posts'),
  _creationTime: v.number(),
  ...basePostSchema.fields,
});

export const getPostByIdSchema = v.object({
  ...postSchema.fields,
  socialProviders: v.array(socialProviderSchema),
  alternativeContent: v.array(
    v.object({
      ...alternativeContentSchema.fields,
      socialProvider: socialProviderSchema,
    })
  ),
});

export type GetPostByIdSchema = Infer<typeof getPostByIdSchema>;

// Post creation schema (subset for mutations)
export const postCreateSchema = v.object({
  userId: v.optional(v.id('users')),
  organizationId: v.optional(v.string()),
  status: postStatusSchema,
  scheduledAt: v.optional(v.number()),
  reviewStatus: v.optional(postReviewStatusSchema),
  privacyStatus: v.optional(privacyStatusSchema),
  content: v.array(contentSchema),
  alternativeContent: v.optional(v.array(alternativeContentSchema)),
  socialProviderIds: v.array(v.id('socialProviders')),
});

// Post update schema (partial)
export const postUpdateSchema = v.object({
  status: v.optional(postStatusSchema),
  scheduledAt: v.optional(v.number()),
  reviewStatus: v.optional(postReviewStatusSchema),
  privacyStatus: v.optional(privacyStatusSchema),
  content: v.optional(v.array(contentSchema)),
  alternativeContent: v.optional(v.array(alternativeContentSchema)),
  socialProviderIds: v.optional(v.array(v.id('socialProviders'))),
  postFailureReason: v.optional(v.string()),
  publishedAt: v.optional(v.number()),
  lastFailedAt: v.optional(v.number()),
  retryCount: v.optional(v.number()),
});

// ============================================================================
// MEDIA TABLE SCHEMAS (External Storage)
// ============================================================================

// Base media table schema without system fields
export const baseMediaTableSchema = v.object({
  userId: v.id('users'),
  organizationId: v.optional(v.string()),
  bucketKey: v.string(),
  url: v.string(),
  mediaType: mediaTypeSchema,
  originalFilename: v.optional(v.string()),
  size: v.optional(v.number()),
  extension: v.optional(v.string()),
  altText: v.optional(v.string()),
  bucketUrl: v.optional(v.string()),
  thumbnailBucketUrl: v.optional(v.string()),
  thumbnailBucketKey: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

// Media table schema with system fields (for returns)
export const mediaTableSchema = v.object({
  _id: v.id('media'),
  ...baseMediaTableSchema.fields,
});

// Media creation schema
export const mediaCreateSchema = v.object({
  userId: v.id('users'),
  organizationId: v.optional(v.string()),
  bucketKey: v.string(),
  url: v.string(),
  mediaType: mediaTypeSchema,
  originalFilename: v.optional(v.string()),
  size: v.optional(v.number()),
  extension: v.optional(v.string()),
  altText: v.optional(v.string()),
  bucketUrl: v.optional(v.string()),
  thumbnailBucketUrl: v.optional(v.string()),
  thumbnailBucketKey: v.optional(v.string()),
});

// Media update schema (partial)
export const mediaUpdateSchema = v.object({
  url: v.optional(v.string()),
  originalFilename: v.optional(v.string()),
  size: v.optional(v.number()),
  extension: v.optional(v.string()),
  altText: v.optional(v.string()),
  bucketUrl: v.optional(v.string()),
  thumbnailBucketUrl: v.optional(v.string()),
  thumbnailBucketKey: v.optional(v.string()),
});
