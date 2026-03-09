/**
 * Transform internal Convex docs to external API format.
 * Maps internal field names to developer-friendly external names.
 */

// biome-ignore lint/suspicious/noExplicitAny: Convex docs are untyped at the API boundary
type ConvexDoc = Record<string, any>;

/** Extract caption text from internal content blocks array */
function extractCaption(content: ConvexDoc[] | undefined): string {
  if (!content || content.length === 0) {
    return "";
  }
  return content[0]?.text || "";
}

/** Extract flat media array from internal content blocks */
function extractMedia(
  content: ConvexDoc[] | undefined
): { url: string; type: string; alt_text?: string }[] {
  if (!content || content.length === 0) {
    return [];
  }
  const media = content[0]?.media;
  if (!Array.isArray(media)) {
    return [];
  }
  return media.map((m: ConvexDoc) => ({
    url: m.url,
    type: m.type,
    ...(m.altText ? { alt_text: m.altText } : {}),
  }));
}

export function transformPost(post: ConvexDoc) {
  if (!post) {
    return null;
  }
  return {
    id: post._id,
    status: post.status,
    caption: extractCaption(post.content),
    media: extractMedia(post.content),
    account_ids: post.socialProviderIds,
    accounts: post.socialProviders?.map(transformAccount),
    account_overrides: post.alternativeContent?.map((alt: ConvexDoc) => ({
      account_id: alt.socialProviderId,
      caption: extractCaption(alt.content),
      media: extractMedia(alt.content),
      account: alt.socialProvider
        ? transformAccount(alt.socialProvider)
        : undefined,
    })),
    account_settings: post.providerSettings?.map((ps: ConvexDoc) => ({
      account_id: ps.socialProviderId,
      type: ps.type,
      settings: ps.settings,
    })),
    scheduled_at: post.scheduledAt,
    published_at: post.publishedAt,
    created_at: post.createdAt,
    updated_at: post.updatedAt,
  };
}

export function transformAccount(account: ConvexDoc) {
  if (!account) {
    return null;
  }
  return {
    id: account._id,
    platform: account.socialType,
    username: account.username,
    full_name: account.fullName,
    profile_image: account.profileImage,
    is_active: account.isActive,
    created_at: account._creationTime,
  };
}
