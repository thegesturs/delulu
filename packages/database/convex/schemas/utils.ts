import { v } from 'convex/values';
import {
  mediaTypeSchema,
  postReviewStatusSchema,
  postStatusSchema,
  privacyStatusSchema,
} from './enums';
import { postSchema } from './posts_media';

// ============================================================================
// UTILITY SCHEMAS FOR QUERIES
// ============================================================================

// Post filters
export const postFiltersSchema = v.object({
  status: v.optional(postStatusSchema),
  privacyStatus: v.optional(privacyStatusSchema),
  reviewStatus: v.optional(postReviewStatusSchema),
  organizationId: v.optional(v.string()),
  isDeleted: v.optional(v.boolean()),
});

// Media filters
export const mediaFiltersSchema = v.object({
  mediaType: v.optional(mediaTypeSchema),
  limit: v.optional(v.number()),
  offset: v.optional(v.number()),
});

// Search filters
export const searchFiltersSchema = v.object({
  organizationId: v.optional(v.id('organizations')),
  searchTerm: v.string(),
  mediaType: v.optional(mediaTypeSchema),
  limit: v.optional(v.number()),
  offset: v.optional(v.number()),
});

// ============================================================================
// RESPONSE SCHEMAS FOR PAGINATED RESULTS
// ============================================================================

export const paginatedPostsSchema = v.object({
  page: v.array(postSchema),
  isDone: v.boolean(),
  continueCursor: v.union(v.string(), v.null()),
});

export const mediaStatsSchema = v.object({
  totalCount: v.number(),
  imageCount: v.number(),
  videoCount: v.number(),
  totalSize: v.number(),
});

export const cascadeDeleteResultSchema = v.object({
  success: v.boolean(),
  updatedPostsCount: v.number(),
  deletedPlatformPostsCount: v.number(),
  message: v.string(),
});

export const userDeleteResultSchema = v.object({
  success: v.boolean(),
  deletedSessionsCount: v.number(),
  deletedAccountsCount: v.number(),
  deletedPostsCount: v.number(),
  deletedSocialProvidersCount: v.number(),
  deletedMediaCount: v.number(),
  message: v.string(),
});

export const cleanupResultSchema = v.object({
  success: v.boolean(),
  deletedCount: v.number(),
  message: v.string(),
});

export const batchDeleteResultSchema = v.object({
  success: v.boolean(),
  deletedCount: v.number(),
  failedCount: v.number(),
  message: v.string(),
});
