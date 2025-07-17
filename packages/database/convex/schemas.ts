import { v } from 'convex/values';

// ============================================================================
// ENUMS AND BASIC TYPES
// ============================================================================

export const socialTypeSchema = v.union(
  v.literal('TWITTER'),
  v.literal('LINKEDIN'),
  v.literal('LENS'),
  v.literal('YOUTUBE'),
  v.literal('INSTAGRAM'),
  v.literal('FACEBOOK'),
  v.literal('TIKTOK'),
  v.literal('THREADS'),
  v.literal('PINTEREST'),
  v.literal('FARCASTER'),
  v.literal('BLUESKY')
);

export const postStatusSchema = v.union(
  v.literal('SAVED'),
  v.literal('PUBLISHED'),
  v.literal('SCHEDULED'),
  v.literal('DELETED'),
  v.literal('FAILED')
);

export const postReviewStatusSchema = v.union(
  v.literal('PENDING'),
  v.literal('APPROVED'),
  v.literal('REJECTED')
);

export const privacyStatusSchema = v.union(
  v.literal('PUBLIC'),
  v.literal('PRIVATE'),
  v.literal('UNLISTED')
);

export const mediaTypeSchema = v.union(v.literal('IMAGE'), v.literal('VIDEO'));

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
  media: v.array(mediaSchema),
  text: v.string(),
  tags: v.optional(v.array(v.string())),
  socialId: v.optional(v.string()),
});

// ============================================================================
// ALTERNATIVE CONTENT SCHEMA
// ============================================================================

export const alternativeContentSchema = v.object({
  socialProviderId: v.id('socialProviders'),
  content: v.array(contentSchema),
});

// ============================================================================
// USER SCHEMAS
// ============================================================================

// Base user schema without system fields
export const baseUserSchema = v.object({
  name: v.string(),
  email: v.string(),
  emailVerified: v.boolean(),
  image: v.optional(v.string()),
  usage: v.object({
    socialAccounts: v.number(),
    generatedPosts: v.number(),
    drafts: v.number(),
    organization: v.number(),
  }),
  createdAt: v.number(),
  updatedAt: v.number(),
});

// User schema with system fields (for returns)
export const userSchema = v.object({
  _id: v.id('users'),
  ...baseUserSchema.fields,
});

// User creation schema (subset for mutations)
export const userCreateSchema = v.object({
  name: v.string(),
  email: v.string(),
  emailVerified: v.optional(v.boolean()),
  image: v.optional(v.string()),
});

// User update schema (partial)
export const userUpdateSchema = v.object({
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerified: v.optional(v.boolean()),
  image: v.optional(v.string()),
});

// ============================================================================
// SESSION SCHEMAS
// ============================================================================

export const baseSessionSchema = v.object({
  token: v.string(),
  userId: v.id('users'),
  expiresAt: v.number(),
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const sessionSchema = v.object({
  _id: v.id('sessions'),
  ...baseSessionSchema.fields,
});

export const sessionCreateSchema = v.object({
  token: v.string(),
  userId: v.id('users'),
  expiresAt: v.number(),
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
});

// ============================================================================
// ACCOUNT SCHEMAS
// ============================================================================

export const baseAccountSchema = v.object({
  userId: v.id('users'),
  accountId: v.string(),
  providerId: v.string(),
  accessToken: v.optional(v.string()),
  refreshToken: v.optional(v.string()),
  idToken: v.optional(v.string()),
  accessTokenExpiresAt: v.optional(v.number()),
  refreshTokenExpiresAt: v.optional(v.number()),
  scope: v.optional(v.string()),
  password: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const accountSchema = v.object({
  _id: v.id('accounts'),
  ...baseAccountSchema.fields,
});

export const accountCreateSchema = v.object({
  userId: v.id('users'),
  accountId: v.string(),
  providerId: v.string(),
  accessToken: v.optional(v.string()),
  refreshToken: v.optional(v.string()),
  idToken: v.optional(v.string()),
  accessTokenExpiresAt: v.optional(v.number()),
  refreshTokenExpiresAt: v.optional(v.number()),
  scope: v.optional(v.string()),
  password: v.optional(v.string()),
});

// ============================================================================
// VERIFICATION SCHEMAS
// ============================================================================

export const baseVerificationSchema = v.object({
  identifier: v.string(),
  value: v.string(),
  expiresAt: v.number(),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
});

export const verificationSchema = v.object({
  _id: v.id('verifications'),
  ...baseVerificationSchema.fields,
});

export const verificationCreateSchema = v.object({
  identifier: v.string(),
  value: v.string(),
  expiresAt: v.number(),
});

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
  createdAt: v.number(),
  updatedAt: v.number(),
  publishedAt: v.optional(v.number()),
  lastFailedAt: v.optional(v.number()),
  retryCount: v.number(),
});

// Post schema with system fields (for returns)
export const postSchema = v.object({
  _id: v.id('posts'),
  ...basePostSchema.fields,
});

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
// SOCIAL PROVIDER SCHEMAS
// ============================================================================

// Base social provider schema without system fields
export const baseSocialProviderSchema = v.object({
  organizationId: v.optional(v.string()),
  userId: v.optional(v.id('users')),
  accessToken: v.string(),
  refreshToken: v.optional(v.string()),
  expiresIn: v.number(),
  refreshTokenExpiresIn: v.optional(v.number()),
  profileId: v.string(),
  username: v.optional(v.string()),
  fullName: v.string(),
  profileImage: v.string(),
  socialType: socialTypeSchema,
  createdAt: v.number(),
  updatedAt: v.number(),
  isActive: v.boolean(),
  lastSyncedAt: v.optional(v.number()),
});

// Social provider schema with system fields (for returns)
export const socialProviderSchema = v.object({
  _id: v.id('socialProviders'),
  ...baseSocialProviderSchema.fields,
});

// Social provider creation schema
export const socialProviderCreateSchema = v.object({
  organizationId: v.optional(v.string()),
  userId: v.optional(v.id('users')),
  accessToken: v.string(),
  refreshToken: v.optional(v.string()),
  expiresIn: v.number(),
  refreshTokenExpiresIn: v.optional(v.number()),
  profileId: v.string(),
  username: v.optional(v.string()),
  fullName: v.string(),
  profileImage: v.string(),
  socialType: socialTypeSchema,
  isActive: v.optional(v.boolean()),
});

// Social provider update schema (partial)
export const socialProviderUpdateSchema = v.object({
  organizationId: v.optional(v.string()),
  accessToken: v.optional(v.string()),
  refreshToken: v.optional(v.string()),
  expiresIn: v.optional(v.number()),
  refreshTokenExpiresIn: v.optional(v.number()),
  profileId: v.optional(v.string()),
  username: v.optional(v.string()),
  fullName: v.optional(v.string()),
  profileImage: v.optional(v.string()),
  socialType: v.optional(socialTypeSchema),
  isActive: v.optional(v.boolean()),
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

// ============================================================================
// UTILITY SCHEMAS FOR QUERIES
// ============================================================================

// Pagination options
export const paginationSchema = v.object({
  limit: v.optional(v.number()),
  offset: v.optional(v.number()),
});

// Post filters
export const postFiltersSchema = v.object({
  status: v.optional(postStatusSchema),
  privacyStatus: v.optional(privacyStatusSchema),
  reviewStatus: v.optional(postReviewStatusSchema),
  organizationId: v.optional(v.string()),
  isDeleted: v.optional(v.boolean()),
  limit: v.optional(v.number()),
  offset: v.optional(v.number()),
});

// Media filters
export const mediaFiltersSchema = v.object({
  mediaType: v.optional(mediaTypeSchema),
  limit: v.optional(v.number()),
  offset: v.optional(v.number()),
});

// Search filters
export const searchFiltersSchema = v.object({
  userId: v.optional(v.id('users')),
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
  posts: v.array(postSchema),
  total: v.number(),
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
