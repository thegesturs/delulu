import { MediaId } from "@delulu/core";
import { ClerkAdminService, JobService, R2Service } from "@delulu/services";
import { Effect, type Layer, Schema } from "effect";
import { SqlClient } from "effect/unstable/sql";
import type { AppServices } from "./app";
import type { Env } from "./env";

const dispatchProgram = (env: Env) =>
  Effect.gen(function* () {
    const jobs = yield* JobService;
    const r2 = yield* R2Service;
    const sql = yield* SqlClient.SqlClient;
    const clerk = yield* ClerkAdminService;
    const claimed = yield* jobs.claimDue({ limit: 50, leaseSeconds: 120 });
    for (const job of claimed) {
      const result = yield* Effect.gen(function* () {
        switch (job.payload._tag) {
          case "PublishTarget": {
            const subscriptions = yield* sql<{ active: boolean }>`SELECT EXISTS(
              SELECT 1 FROM subscriptions s JOIN workspaces w
                ON w.billing_owner_user_id = s.billing_owner_user_id
              WHERE w.id = ${job.workspaceId} AND s.status IN ('active','trialing')
                AND NOT EXISTS (SELECT 1 FROM cancellation_requests c
                  WHERE c.billing_owner_user_id = s.billing_owner_user_id
                    AND c.status IN ('effective','deleting','deleted'))
            ) AS active`;
            if (!subscriptions[0]?.active) {
              return yield* Effect.fail(
                new Error("Subscription is not active")
              );
            }
            if (!(env.SQS_INGRESS_URL && env.SQS_INGRESS_SECRET)) {
              return yield* Effect.fail(
                new Error("SQS ingress is not configured")
              );
            }
            const targetId = job.payload.targetId;
            const response = yield* Effect.promise(() =>
              fetch(env.SQS_INGRESS_URL as string, {
                method: "POST",
                headers: {
                  "content-type": "application/json",
                  "x-api-key": env.SQS_INGRESS_SECRET as string,
                },
                body: JSON.stringify({ jobId: job.id, targetId }),
              })
            );
            if (!response.ok) {
              return yield* Effect.fail(
                new Error(`SQS ingress returned ${response.status}`)
              );
            }
            yield* jobs.markDispatched(job.id);
            return;
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
              yield* sql`UPDATE subscriptions SET media_storage_bytes = GREATEST(0, media_storage_bytes - ${Number(row.sizeBytes)})
                WHERE billing_owner_user_id = ${String(row.billingOwnerUserId)}`;
            }
            yield* jobs.complete(job.id);
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
              yield* jobs.defer(
                job.id,
                new Date(Date.now() + 24 * 60 * 60 * 1000),
                "Media remains referenced by an active post"
              );
            } else {
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
                  yield* jobs.complete(job.id);
                })
              );
            }
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
                yield* jobs.complete(job.id);
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
            yield* jobs.complete(job.id);
            return;
          }
          default: {
            return yield* Effect.fail(new Error("Unsupported job payload"));
          }
        }
      }).pipe(Effect.result);
      if (result._tag === "Failure") {
        yield* jobs.retry(
          job.id,
          result.failure instanceof Error
            ? result.failure.message
            : String(result.failure)
        );
      }
    }
  });

export const dispatchDueJobs = (env: Env, layer: Layer.Layer<AppServices>) =>
  Effect.runPromise(dispatchProgram(env).pipe(Effect.provide(layer)));
