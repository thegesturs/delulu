import {
  postReviewStatusEnum,
  postStatusEnum,
  privacyStatusEnum,
} from './post.sql';

// Re-export the types from the SQL schema
export type PostStatus = (typeof postStatusEnum.enumValues)[number];
export const PostStatus = Object.fromEntries(
  postStatusEnum.enumValues.map((value) => [value, value])
) as Record<PostStatus, PostStatus>;

export type PostReviewStatus = (typeof postReviewStatusEnum.enumValues)[number];
export const PostReviewStatus = Object.fromEntries(
  postReviewStatusEnum.enumValues.map((value) => [value, value])
) as Record<PostReviewStatus, PostReviewStatus>;

export type PrivacyStatus = (typeof privacyStatusEnum.enumValues)[number];
export const PrivacyStatus = Object.fromEntries(
  privacyStatusEnum.enumValues.map((value) => [value, value])
) as Record<PrivacyStatus, PrivacyStatus>;
