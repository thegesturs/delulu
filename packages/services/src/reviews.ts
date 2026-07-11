import {
  ConflictError,
  NotFoundError,
  type ReviewAction,
  type ReviewView,
} from "@delulu/contracts";
import {
  contentFingerprint,
  makeId,
  PostReviewId,
  ReviewActivityId,
  rolePermissions,
  type WorkspaceId,
  type WorkspaceRole,
} from "@delulu/core";
import { Context, Effect, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { JobService } from "./jobs";

type ReviewOutput = typeof ReviewView.Type;
type ReviewActionInput = typeof ReviewAction.Type;
const output = (row: Record<string, unknown>): ReviewOutput => ({
  id: String(row.id),
  postId: String(row.postId),
  status: row.status as ReviewOutput["status"],
  contentFingerprint: String(row.contentFingerprint),
  submittedByMemberId: String(row.submittedByMemberId),
  resolvedByMemberId:
    row.resolvedByMemberId === null ? null : String(row.resolvedByMemberId),
  resolvedAt:
    row.resolvedAt === null
      ? null
      : new Date(row.resolvedAt as Date | string).toISOString(),
});

export class ReviewService extends Context.Service<
  ReviewService,
  {
    readonly queue: (
      workspaceId: WorkspaceId,
      limit: number,
      offset: number
    ) => Effect.Effect<{
      data: readonly ReviewOutput[];
      total: number;
      limit: number;
      offset: number;
    }>;
    readonly getForPost: (
      workspaceId: WorkspaceId,
      postId: string
    ) => Effect.Effect<ReviewOutput | null>;
    readonly activity: (
      workspaceId: WorkspaceId,
      postId: string
    ) => Effect.Effect<
      readonly {
        id: string;
        activityType:
          | "review.submitted"
          | "review.approved"
          | "review.rejected"
          | "review.withdrawn"
          | "review.commented"
          | "schedule.missed";
        actorMemberId: string;
        comment: string | null;
        createdAt: string;
      }[]
    >;
    readonly act: (input: {
      workspaceId: WorkspaceId;
      postId: string;
      memberId: string;
      role: WorkspaceRole;
      action: ReviewActionInput;
    }) => Effect.Effect<ReviewOutput, ConflictError | NotFoundError>;
  }
>()("@delulu/services/ReviewService") {
  static readonly layer = Layer.effect(
    ReviewService,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const jobs = yield* JobService;
      const getForPost = Effect.fn("ReviewService.getForPost")(function* (
        workspaceId: WorkspaceId,
        postId: string
      ) {
        const rows = yield* sql<
          Record<string, unknown>
        >`SELECT id, post_id, status, content_fingerprint,
          submitted_by_member_id, resolved_by_member_id, resolved_at FROM post_reviews
          WHERE workspace_id = ${workspaceId} AND post_id = ${postId}`.pipe(
          Effect.orDie
        );
        return rows[0] ? output(rows[0]) : null;
      });
      const queue = Effect.fn("ReviewService.queue")(function* (
        workspaceId: WorkspaceId,
        limit: number,
        offset: number
      ) {
        const rows = yield* sql<
          Record<string, unknown>
        >`SELECT id, post_id, status, content_fingerprint,
          submitted_by_member_id, resolved_by_member_id, resolved_at FROM post_reviews
          WHERE workspace_id = ${workspaceId} AND status = 'pending' ORDER BY updated_at DESC
          LIMIT ${limit} OFFSET ${offset}`.pipe(Effect.orDie);
        const totals = yield* sql<{
          count: string;
        }>`SELECT count(*)::text AS count FROM post_reviews WHERE workspace_id = ${workspaceId} AND status = 'pending'`.pipe(
          Effect.orDie
        );
        return {
          data: rows.map(output),
          total: Number(totals[0]?.count ?? 0),
          limit,
          offset,
        };
      });
      const activity = Effect.fn("ReviewService.activity")(function* (
        workspaceId: WorkspaceId,
        postId: string
      ) {
        const rows = yield* sql<
          Record<string, unknown>
        >`SELECT id, activity_type, actor_member_id, comment, created_at
          FROM review_activity WHERE workspace_id = ${workspaceId} AND post_id = ${postId} ORDER BY created_at`.pipe(
          Effect.orDie
        );
        return rows.map((row) => ({
          id: String(row.id),
          activityType: row.activityType as "review.submitted",
          actorMemberId: String(row.actorMemberId),
          comment: row.comment === null ? null : String(row.comment),
          createdAt: new Date(row.createdAt as Date | string).toISOString(),
        }));
      });
      const addActivity = (
        workspaceId: WorkspaceId,
        postId: string,
        reviewId: string,
        memberId: string,
        activityType: string,
        comment: string | null
      ) =>
        sql`INSERT INTO review_activity
          (id, workspace_id, post_id, review_id, actor_member_id, activity_type, comment)
          VALUES (${makeId(ReviewActivityId)}, ${workspaceId}, ${postId}, ${reviewId}, ${memberId}, ${activityType}, ${comment})`.pipe(
          Effect.asVoid
        );
      const act = Effect.fn("ReviewService.act")(function* (input: {
        workspaceId: WorkspaceId;
        postId: string;
        memberId: string;
        role: WorkspaceRole;
        action: ReviewActionInput;
      }) {
        const posts = yield* sql<
          Record<string, unknown>
        >`SELECT id, content, status, created_by_member_id FROM posts
          WHERE id = ${input.postId} AND workspace_id = ${input.workspaceId} AND deleted_at IS NULL`.pipe(
          Effect.orDie
        );
        const post = posts[0];
        if (!post) {
          return yield* new NotFoundError({
            message: "Post not found",
            resource: "post",
          });
        }
        const existing = yield* getForPost(input.workspaceId, input.postId);
        if (input.action.action === "comment") {
          if (input.role === "viewer" || !existing) {
            return yield* new ConflictError({
              message: "Review comments are not available",
              resource: "review",
            });
          }
          yield* addActivity(
            input.workspaceId,
            input.postId,
            existing.id,
            input.memberId,
            "review.commented",
            input.action.comment
          ).pipe(Effect.orDie);
          return existing;
        }
        if (input.action.action === "submit") {
          if (
            input.role !== "editor" ||
            String(post.createdByMemberId) !== input.memberId
          ) {
            return yield* new ConflictError({
              message: "Only the editor author can submit this post",
              resource: "review",
            });
          }
          const fingerprint = yield* Effect.promise(() =>
            contentFingerprint(post.content)
          );
          const id = existing?.id ?? makeId(PostReviewId);
          yield* sql
            .withTransaction(
              sql`INSERT INTO post_reviews
                (id, workspace_id, post_id, status, content_fingerprint, submitted_by_member_id)
                VALUES (${id}, ${input.workspaceId}, ${input.postId}, 'pending', ${fingerprint}, ${input.memberId})
                ON CONFLICT (post_id) DO UPDATE SET status = 'pending', content_fingerprint = EXCLUDED.content_fingerprint,
                  submitted_by_member_id = EXCLUDED.submitted_by_member_id, resolved_by_member_id = NULL, resolved_at = NULL`.pipe(
                Effect.andThen(
                  sql`UPDATE posts SET status = 'pending_review' WHERE id = ${input.postId}`
                ),
                Effect.andThen(
                  addActivity(
                    input.workspaceId,
                    input.postId,
                    id,
                    input.memberId,
                    "review.submitted",
                    input.action.comment ?? null
                  )
                )
              )
            )
            .pipe(Effect.orDie);
          return (yield* getForPost(
            input.workspaceId,
            input.postId
          )) as ReviewOutput;
        }
        if (!existing) {
          return yield* new NotFoundError({
            message: "Review not found",
            resource: "review",
          });
        }
        if (existing.status !== "pending") {
          return yield* new ConflictError({
            message: "Only a pending review can be resolved",
            resource: "review",
          });
        }
        if (input.action.action === "withdraw") {
          if (
            existing.submittedByMemberId !== input.memberId &&
            !rolePermissions[input.role].approve
          ) {
            return yield* new ConflictError({
              message: "Only the submitter or a reviewer can withdraw",
              resource: "review",
            });
          }
          yield* sql
            .withTransaction(
              sql`UPDATE post_reviews SET status = 'rejected', resolved_by_member_id = ${input.memberId}, resolved_at = now()
                WHERE id = ${existing.id}`.pipe(
                Effect.andThen(
                  sql`UPDATE posts SET status = 'draft' WHERE id = ${input.postId}`
                ),
                Effect.andThen(
                  addActivity(
                    input.workspaceId,
                    input.postId,
                    existing.id,
                    input.memberId,
                    "review.withdrawn",
                    null
                  )
                )
              )
            )
            .pipe(Effect.orDie);
          return existing;
        }
        if (!rolePermissions[input.role].approve) {
          return yield* new ConflictError({
            message: "Role cannot resolve reviews",
            resource: "review",
          });
        }
        if (input.action.action === "reject") {
          if (!input.action.reason.trim()) {
            return yield* new ConflictError({
              message: "A rejection reason is required",
              resource: "review",
            });
          }
          yield* sql
            .withTransaction(
              sql`UPDATE post_reviews SET status = 'rejected', resolved_by_member_id = ${input.memberId}, resolved_at = now() WHERE id = ${existing.id}`.pipe(
                Effect.andThen(
                  sql`UPDATE posts SET status = 'changes_requested' WHERE id = ${input.postId}`
                ),
                Effect.andThen(
                  addActivity(
                    input.workspaceId,
                    input.postId,
                    existing.id,
                    input.memberId,
                    "review.rejected",
                    input.action.reason
                  )
                )
              )
            )
            .pipe(Effect.orDie);
          return (yield* getForPost(
            input.workspaceId,
            input.postId
          )) as ReviewOutput;
        }
        if (input.action.action !== "approve") {
          return yield* new ConflictError({
            message: "Unsupported review action",
            resource: "review",
          });
        }
        const approve = input.action;
        const fingerprint = yield* Effect.promise(() =>
          contentFingerprint(post.content)
        );
        if (fingerprint !== existing.contentFingerprint) {
          return yield* new ConflictError({
            message: "Post content changed after review submission",
            resource: "review",
          });
        }
        const targets = yield* sql<{
          id: string;
          scheduledAt: Date | null;
          isMissed: boolean;
        }>`SELECT id, scheduled_at,
            (scheduled_at IS NOT NULL AND scheduled_at <= now()) AS is_missed
          FROM post_targets WHERE post_id = ${input.postId}`.pipe(Effect.orDie);
        const missed = targets.some((target) => target.isMissed);
        if (missed && !approve.missedSlot) {
          return yield* new ConflictError({
            message: "Choose whether to reschedule or publish now",
            resource: "schedule",
          });
        }
        yield* sql
          .withTransaction(
            Effect.gen(function* () {
              if (missed) {
                const at =
                  approve.missedSlot === "publish_now"
                    ? new Date()
                    : approve.scheduledAt
                      ? new Date(approve.scheduledAt)
                      : null;
                if (!at || Number.isNaN(at.getTime())) {
                  return yield* new ConflictError({
                    message: "A valid replacement schedule is required",
                    resource: "schedule",
                  });
                }
                yield* sql`UPDATE post_targets SET scheduled_at = ${at}
                  WHERE post_id = ${input.postId}
                    AND scheduled_at IS NOT NULL AND scheduled_at <= now()`;
                yield* addActivity(
                  input.workspaceId,
                  input.postId,
                  existing.id,
                  input.memberId,
                  "schedule.missed",
                  approve.missedSlot ?? null
                );
              }
              yield* sql`UPDATE post_reviews SET status = 'approved', resolved_by_member_id = ${input.memberId}, resolved_at = now() WHERE id = ${existing.id}`;
              yield* sql`UPDATE posts SET status = 'scheduled' WHERE id = ${input.postId}`;
              yield* addActivity(
                input.workspaceId,
                input.postId,
                existing.id,
                input.memberId,
                "review.approved",
                approve.comment ?? null
              );
              const due = yield* sql<{
                id: string;
                scheduledAt: Date | null;
              }>`SELECT id, scheduled_at FROM post_targets WHERE post_id = ${input.postId}`;
              for (const target of due) {
                yield* jobs.enqueue({
                  workspaceId: input.workspaceId,
                  payload: {
                    _tag: "PublishTarget",
                    targetId: target.id as never,
                  },
                  runAt: target.scheduledAt ?? new Date(),
                  idempotencyKey: `publish-target:${target.id}`,
                });
              }
            })
          )
          .pipe(Effect.orDie);
        return (yield* getForPost(
          input.workspaceId,
          input.postId
        )) as ReviewOutput;
      });
      return ReviewService.of({ queue, getForPost, activity, act });
    })
  );
}
