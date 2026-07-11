import { transformAutomations } from "./automations";
import { transformBilling } from "./billing";
import type { TransformContext } from "./context";
import { COUNTER } from "./counters";
import type { DecodedData } from "./decode-all";
import type { MediaResolver } from "./media";
import { transformPosts } from "./posts";
import { dedupeReviewsByPost, transformReviews } from "./reviews";
import { transformTranscriptions } from "./transcriptions";

/** Posts + jobs + reviews (async for content fingerprints). */
export const attachPostSpine = async (
  ctx: TransformContext,
  data: DecodedData,
  resolver: MediaResolver
): Promise<void> => {
  const reviewByPost = dedupeReviewsByPost(data.postReviews);
  const collapsed = data.postReviews.length - reviewByPost.size;
  if (collapsed > 0) {
    ctx.counters.bump(COUNTER.reviewsCollapsedDuplicate, collapsed);
  }
  transformPosts(ctx, data.posts, resolver, reviewByPost);
  await transformReviews(ctx, {
    reviewByPost,
    reviewActivity: data.reviewActivity,
  });
};

/** Billing, automations, and transcriptions. */
export const attachOperations = (
  ctx: TransformContext,
  data: DecodedData
): void => {
  transformBilling(ctx, {
    users: data.users,
    subscriptions: data.subscriptions,
    transactions: data.transactions,
  });
  transformAutomations(ctx, {
    automations: data.automations,
    automationLogs: data.automationLogs,
    automationContacts: data.automationContacts,
  });
  transformTranscriptions(ctx, data.transcriptions);
};
