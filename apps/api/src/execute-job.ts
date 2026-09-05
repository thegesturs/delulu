import { MediaId, rollupPostStatus } from "@delulu/core";
import {
  AutomationService,
  BillingReconciliation,
  CancellationService,
  ClerkAdminService,
  type DurableJob,
  EntitlementPolicy,
  JobService,
  LifecycleService,
  MessagingService,
  R2Service,
} from "@delulu/services";
import { Effect, type Layer, Schema } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { publishTarget } from "../../../packages/worker/publish-target";
import type { AppServices } from "./app";

/** Execute one DO-owned job. No Postgres queue, leases or transport dispatch. */
export const executeJob = (
  job: DurableJob,
  layer: Layer.Layer<AppServices>
): Promise<number | null> =>
  Effect.gen(function* () {
    const jobs = yield* JobService;
    const r2 = yield* R2Service;
    const sql = yield* SqlClient.SqlClient;
    const clerk = yield* ClerkAdminService;
    const entitlements = yield* EntitlementPolicy;
    switch (job.payload._tag) {
      case "PublishTarget": {
        const subscriptions = (yield* entitlements.isCommunity)
          ? [{ active: true }]
          : yield* sql<{ active: boolean }>`SELECT EXISTS(
              SELECT 1 FROM subscriptions s JOIN workspaces w
                ON w.billing_owner_user_id = s.billing_owner_user_id
              WHERE w.id = ${job.workspaceId} AND s.status IN ('active','trialing')
                AND NOT EXISTS (SELECT 1 FROM cancellation_requests c
                  WHERE c.billing_owner_user_id = s.billing_owner_user_id
                    AND c.status IN ('effective','deleting','deleted'))
            ) AS active`;
        if (!subscriptions[0]?.active) {
          return yield* Effect.fail(new Error("Subscription is not active"));
        }
        return yield* Effect.promise(() => publishTarget(job, layer));
      }

      case "DeleteMediaObject": {
        const rows = yield* sql<
          Record<string, unknown>
        >`SELECT m.bucket_key, m.size_bytes,
              w.billing_owner_user_id FROM media m JOIN workspaces w ON w.id = m.workspace_id
              WHERE m.id = ${job.payload.mediaId}`;
        const row = rows[0];
        if (row) {
          yield* r2.remove(String(row.bucketKey));
          yield* sql`UPDATE subscriptions SET media_storage_bytes = (
                SELECT COALESCE(sum(m.size_bytes), 0) FROM media m JOIN workspaces w ON w.id = m.workspace_id
                WHERE w.billing_owner_user_id = ${String(row.billingOwnerUserId)} AND m.deleted_at IS NULL AND w.deleted_at IS NULL)
                WHERE billing_owner_user_id = ${String(row.billingOwnerUserId)}`;
        }

        return;
      }
      case "ReclaimMedia": {
        const mediaId = job.payload.mediaId;
        const referenced = yield* sql<{ exists: boolean }>`SELECT EXISTS(
              SELECT 1 FROM posts WHERE workspace_id = ${job.workspaceId} AND deleted_at IS NULL
              AND status IN ('draft','pending_review','changes_requested','scheduled','publishing')
              AND content::text LIKE ${`%${mediaId}%`}
            ) AS exists`;
        if (referenced[0]?.exists) {
          return Date.now() + 24 * 60 * 60 * 1000;
        }
        yield* sql.withTransaction(
          Effect.gen(function* () {
            yield* sql`UPDATE media SET deleted_at = now()
                    WHERE id = ${mediaId} AND deleted_at IS NULL`;
            yield* jobs.enqueue({
              workspaceId: job.workspaceId,
              payload: {
                _tag: "DeleteMediaObject",
                mediaId,
              },
              runAt: new Date(),
              idempotencyKey: `delete-media:${mediaId}`,
            });
          })
        );
        return;
      }
      case "SweepPendingMedia": {
        yield* sql.withTransaction(
          Effect.gen(function* () {
            const stale = yield* sql<{
              id: string;
            }>`UPDATE media SET deleted_at = now(), status = 'failed'
                  WHERE workspace_id = ${job.workspaceId} AND status = 'pending'
                    AND deleted_at IS NULL AND created_at < now() - interval '6 hours' RETURNING id`;
            for (const media of stale) {
              yield* jobs.enqueue({
                workspaceId: job.workspaceId,
                payload: {
                  _tag: "DeleteMediaObject",
                  mediaId: Schema.decodeUnknownSync(MediaId)(media.id),
                },
                runAt: new Date(),
                idempotencyKey: `delete-media:${media.id}`,
              });
            }
          })
        );
        return;
      }
      case "MirrorClerkMembership": {
        if (job.payload.action === "remove") {
          yield* clerk.removeMembership(job.payload);
        } else {
          yield* clerk.updateMembership({
            organizationId: job.payload.organizationId,
            externalUserId: job.payload.externalUserId,
            role: job.payload.role ?? "viewer",
          });
        }

        return;
      }
      case "DeliverMessage":
        yield* (yield* MessagingService).deliver(job.payload.messageId);
        return;
      case "BillingReconcile":
        yield* (yield* BillingReconciliation).run({
          billingOwnerUserId: job.payload.ownerId,
        });
        return;
      case "ExpireReservation":
        yield* sql`UPDATE quota_reservations SET status = 'expired'
              WHERE id = ${job.payload.reservationId} AND status = 'pending' AND expires_at <= now()`;
        return;
      case "CancellationDeadline":
        return yield* (yield* CancellationService).runRetention(
          job.payload.requestId
        );
      case "LifecycleDeadline":
        return yield* (yield* LifecycleService).runScheduled(
          job.payload.ownerId
        );
      case "RepairAutomation":
        yield* (yield* AutomationService).repairTrigger(
          job.payload.profileId,
          job.payload.mediaId
        );
        return;
      default: {
        return yield* Effect.fail(new Error("Unsupported job payload"));
      }
    }
  }).pipe(
    Effect.map((next) => next ?? null),
    Effect.provide(layer),
    Effect.runPromise
  );

/** Persist terminal business status before the object can stop its alarm. */
export const failJob = (
  job: DurableJob,
  error: string,
  layer: Layer.Layer<AppServices>
) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    if (job.payload._tag === "PublishTarget") {
      const targetId = job.payload.targetId;
      const confirmed = yield* sql<{ confirmed: boolean }>`SELECT
        provider_state->'executionOutcome'->>'status' = 'PUBLISHED' AS confirmed
        FROM post_targets WHERE id = ${targetId}`;
      if (confirmed[0]?.confirmed) {
        yield* Effect.promise(() => publishTarget(job, layer));
        return;
      }
      yield* sql.withTransaction(
        Effect.gen(function* () {
          const targets = yield* sql<{ postId: string }>`UPDATE post_targets
          SET status = 'failed', error = ${error}
          WHERE id = ${targetId} AND status IN ('pending', 'publishing') RETURNING post_id`;
          if (targets[0]) {
            const statuses = yield* sql<{
              status: "pending" | "publishing" | "published" | "failed";
            }>`
            SELECT status FROM post_targets WHERE post_id = ${targets[0].postId}`;
            yield* sql`UPDATE posts SET status = ${rollupPostStatus(statuses.map((t) => t.status))}::post_status
            WHERE id = ${targets[0].postId}`;
          }
        })
      );
    } else if (job.payload._tag === "DeliverMessage") {
      yield* sql`UPDATE message_deliveries SET status = 'dead', last_error = ${error}
        WHERE id = ${job.payload.messageId} AND status <> 'sent'`;
    }
  }).pipe(Effect.provide(layer), Effect.runPromise);
