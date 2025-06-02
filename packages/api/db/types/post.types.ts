import {
  PostReviewStatusSchema,
  PostSchema,
  PostStatusSchema, // Assuming this exists in a place like @delulu/database/zod or similar
  PrivacyStatusSchema,
  SocialProviderSchema
} from '@delulu/database/prisma/types/zod'; // Adjust path if these are generated elsewhere or defined in validators
import { z } from 'zod';

// Schema for individual media items within post content (simplified for output)
export const ApiMediaItemSchema = z.object({
  url: z.string().optional(),
  mediaType: z.enum(['IMAGE', 'VIDEO']),
  altText: z.string().optional(),
  thumbnailBucketUrl: z.string().optional(),
});

export type ApiMediaItem = z.infer<typeof ApiMediaItemSchema>;

// Schema for individual content blocks within a post
export const ApiPostContentItemSchema = z.object({
  id: z.string().optional(),
  order: z.number(),
  name: z.string(),
  media: z.array(ApiMediaItemSchema),
  text: z.string(),
  tags: z.array(z.string()).optional().default([]),
  socialId: z.string().optional(),
});

export type ApiPostContentItem = z.infer<typeof ApiPostContentItemSchema>;



// Schema for platform post information (subset of Prisma model)
export const ApiPlatformPostSchema = z.object({
  id: z.string(),
  platformId: z.string(), // Corresponds to SocialProvider.id
  platformPostId: z.string(), // ID of the post on the external platform
  platformPostUrl: z.string(),
});

export type ApiPlatformPost = z.infer<typeof ApiPlatformPostSchema>;
 
// Schema for a single post as returned by the API
export const ApiPostSchema = PostSchema.extend({
  status: PostStatusSchema,
  privacyStatus: PrivacyStatusSchema,
  content: z.array(ApiPostContentItemSchema),
  socialProviders: z.array(SocialProviderSchema).default([]),
  platformPosts: z.array(ApiPlatformPostSchema).default([]),
});

export type ApiPost = z.infer<typeof ApiPostSchema>;

// Schema for the paginated response of posts
export const PaginatedPostsResponseSchema = z.object({
  posts: z.array(ApiPostSchema),
  total: z.number(),
});

export type PaginatedPostsResponse = z.infer<
  typeof PaginatedPostsResponseSchema
>;

// Schema for post filters, mirroring what's in post.repository but for API consistency
export const PostFiltersApiSchema = z.object({
  status: PostStatusSchema.optional(),
  reviewStatus: PostReviewStatusSchema.optional(),
  isDeleted: z.boolean().optional(),
  hasSocialProviders: z.boolean().optional(),
  scheduledBefore: z.date().optional(),
  scheduledAfter: z.date().optional(),
  searchTerm: z.string().optional(),
});

export type PostFiltersApi = z.infer<typeof PostFiltersApiSchema>;

export const PaginationApiSchema = z.object({
  skip: z.number().int().min(0).optional(),
  take: z.number().int().min(1).max(100).optional(), // Max 100 items per page
});

export type PaginationApi = z.infer<typeof PaginationApiSchema>;
