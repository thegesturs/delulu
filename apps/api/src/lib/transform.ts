/**
 * Strip sensitive/internal fields from Convex docs before returning via API.
 */

// biome-ignore lint/suspicious/noExplicitAny: Convex docs are untyped at the API boundary
type ConvexDoc = Record<string, any>;

export function transformPost(post: ConvexDoc) {
  if (!post) {
    return null;
  }
  return {
    id: post._id,
    status: post.status,
    content: post.content,
    alternativeContent: post.alternativeContent?.map((alt: ConvexDoc) => ({
      socialProviderId: alt.socialProviderId,
      content: alt.content,
      socialProvider: alt.socialProvider
        ? transformAccount(alt.socialProvider)
        : undefined,
    })),
    socialProviders: post.socialProviders?.map(transformAccount),
    socialProviderIds: post.socialProviderIds,
    scheduledAt: post.scheduledAt,
    publishedAt: post.publishedAt,
    privacyStatus: post.privacyStatus,
    reviewStatus: post.reviewStatus,
    platformPosts: post.platformPosts,
    providerSettings: post.providerSettings,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

export function transformAccount(account: ConvexDoc) {
  if (!account) {
    return null;
  }
  return {
    id: account._id,
    socialType: account.socialType,
    profileId: account.profileId,
    username: account.username,
    fullName: account.fullName,
    profileImage: account.profileImage,
    isActive: account.isActive,
    lastSyncedAt: account.lastSyncedAt,
    createdAt: account._creationTime,
  };
}
