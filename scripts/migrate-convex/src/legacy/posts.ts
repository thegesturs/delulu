import { Schema } from "effect";
import { SystemFields } from "./common";

export const LegacyPostStatus = Schema.Literals([
  "SAVED",
  "PUBLISHED",
  "SCHEDULED",
  "DELETED",
  "FAILED",
  "PROCESSING",
]);
export type LegacyPostStatus = typeof LegacyPostStatus.Type;

export const LegacyReviewStatus = Schema.Literals([
  "PENDING",
  "APPROVED",
  "REJECTED",
]);
export type LegacyReviewStatus = typeof LegacyReviewStatus.Type;

export const LegacyPrivacyStatus = Schema.Literals([
  "PUBLIC",
  "PRIVATE",
  "UNLISTED",
]);

/** Embedded media reference inside a content segment. */
export const LegacyContentMedia = Schema.Struct({
  url: Schema.optional(Schema.String),
  mediaType: Schema.Literals(["IMAGE", "VIDEO", "DOCUMENT"]),
  bucketUrl: Schema.optional(Schema.String),
  bucketKey: Schema.optional(Schema.String),
  altText: Schema.optional(Schema.String),
  thumbnailBucketUrl: Schema.optional(Schema.String),
  thumbnailBucketKey: Schema.optional(Schema.String),
  thumbnailTimestamp: Schema.optional(Schema.Number),
});
export type LegacyContentMedia = typeof LegacyContentMedia.Type;

export const LegacyContent = Schema.Struct({
  id: Schema.optional(Schema.String),
  order: Schema.Number,
  name: Schema.String,
  title: Schema.optional(Schema.String),
  media: Schema.Array(LegacyContentMedia),
  text: Schema.String,
  tags: Schema.optional(Schema.Array(Schema.String)),
  socialId: Schema.optional(Schema.String),
});
export type LegacyContent = typeof LegacyContent.Type;

export const LegacyAlternativeContent = Schema.Struct({
  socialProviderId: Schema.String,
  content: Schema.Array(LegacyContent),
});
export type LegacyAlternativeContent = typeof LegacyAlternativeContent.Type;

export const LegacyProviderSetting = Schema.Struct({
  socialProviderId: Schema.String,
  type: Schema.String,
  settings: Schema.Unknown,
});
export type LegacyProviderSetting = typeof LegacyProviderSetting.Type;

export const LegacyPlatformPost = Schema.Struct({
  socialProviderId: Schema.String,
  platformPostId: Schema.optional(Schema.String),
  platformPostUrl: Schema.optional(Schema.String),
  postedAt: Schema.optional(Schema.Number),
  failureReason: Schema.optional(Schema.String),
  createdAt: Schema.optional(Schema.Number),
  updatedAt: Schema.optional(Schema.Number),
});
export type LegacyPlatformPost = typeof LegacyPlatformPost.Type;

export const LegacyTikTokSettings = Schema.Struct({
  privacy: Schema.Literals([
    "SELF_ONLY",
    "MUTUAL_FOLLOW_FRIENDS",
    "PUBLIC_TO_EVERYONE",
  ]),
  allowComments: Schema.Boolean,
  allowDuet: Schema.Boolean,
  allowStitch: Schema.Boolean,
  promotionContent: Schema.Literals(["NONE", "SELF", "PAID"]),
});
export type LegacyTikTokSettings = typeof LegacyTikTokSettings.Type;

export const LegacyPost = Schema.Struct({
  ...SystemFields,
  userId: Schema.optional(Schema.String),
  status: LegacyPostStatus,
  scheduledAt: Schema.optional(Schema.Number),
  callMeLaterScheduleId: Schema.optional(Schema.String),
  reviewStatus: LegacyReviewStatus,
  organizationId: Schema.optional(Schema.String),
  isDeleted: Schema.Boolean,
  postFailureReason: Schema.optional(Schema.String),
  privacyStatus: LegacyPrivacyStatus,
  content: Schema.Array(LegacyContent),
  alternativeContent: Schema.optional(Schema.Array(LegacyAlternativeContent)),
  socialProviderIds: Schema.Array(Schema.String),
  tiktokSettings: Schema.optional(LegacyTikTokSettings),
  providerSettings: Schema.optional(Schema.Array(LegacyProviderSetting)),
  externalSubmissionId: Schema.optional(Schema.String),
  platformPosts: Schema.optional(Schema.Array(LegacyPlatformPost)),
  searchableText: Schema.optional(Schema.String),
  createdAt: Schema.optional(Schema.Number),
  updatedAt: Schema.optional(Schema.Number),
  publishedAt: Schema.optional(Schema.Number),
  lastFailedAt: Schema.optional(Schema.Number),
  retryCount: Schema.optional(Schema.Number),
});
export type LegacyPost = typeof LegacyPost.Type;
