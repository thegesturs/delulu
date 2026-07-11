import {
  type PostStatus,
  rollupPostStatus,
  type TargetStatus,
} from "@delulu/core";

export type ReviewOverlay = "pending" | "approved" | "rejected" | undefined;

export interface PostStatusInput {
  readonly targetStatuses: readonly TargetStatus[];
  /** Whether any (kept) target carries a scheduled_at. */
  readonly anyScheduled: boolean;
  /** Overlay from a MIGRATED post_reviews row only (never the raw reviewStatus). */
  readonly overlay: ReviewOverlay;
}

/**
 * Single source of truth for a migrated post's stored status (#147). A post is
 * `draft` only when it has no review overlay and all its targets are pending &
 * unscheduled (or it has no targets); otherwise `rollupPostStatus`. Used by the
 * transform, verify check 3, and the table-driven unit test so they cannot drift.
 */
export const migratedPostStatus = (input: PostStatusInput): PostStatus => {
  const allPendingUnscheduled =
    input.targetStatuses.length > 0 &&
    input.targetStatuses.every((status) => status === "pending") &&
    !input.anyScheduled;
  if (
    input.overlay === undefined &&
    (allPendingUnscheduled || input.targetStatuses.length === 0)
  ) {
    return "draft";
  }
  return rollupPostStatus(input.targetStatuses, input.overlay);
};
