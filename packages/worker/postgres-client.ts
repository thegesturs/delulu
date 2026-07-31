import { POST_PUBLISH_FAILED, POST_PUBLISHED } from "@delulu/analytics/events";
import { getConnection } from "@delulu/connections";
import { ConnectionStore, runPublish } from "@delulu/connections/worker";
import {
  JobId,
  makeId,
  makeTokenCipher,
  normalizePostgresUrl,
  PostTargetId,
  rollupPostStatus,
  TokenCipher,
} from "@delulu/core";
import { makePostgresConnectionStore } from "@delulu/db";
import { getPlanLimits } from "@delulu/payments";
import type {
  ProviderSetting,
  SocialPublishInputType,
  SocialType,
} from "@delulu/validators/post";
import { PgClient } from "@effect/sql-pg";
import {
  Effect,
  String as EffectString,
  Layer,
  Redacted,
  Schema,
} from "effect";
import { SqlClient } from "effect/unstable/sql";
import { resolveMediaUrls } from "./resolve-media-urls";

const PostgresMessage = Schema.Struct({
  jobId: JobId,
  targetId: PostTargetId,
});
type PostgresMessage = typeof PostgresMessage.Type;
const decodeMessage = Schema.decodeUnknownSync(
  Schema.fromJsonString(PostgresMessage)
);

const Pg = PgClient.layer({
  url: Redacted.make(
    normalizePostgresUrl(
      process.env.DATABASE_URL ??
        process.env.DELULU_LIVE_DATABASE_URL ??
        "postgres://delulu:delulu@localhost:5432/delulu"
    )
  ),
  maxConnections: 3,
  transformQueryNames: EffectString.camelToSnake,
  transformResultNames: EffectString.snakeToCamel,
  transformJson: true,
});
const Cipher = Layer.succeed(
  TokenCipher,
  TokenCipher.of(
    makeTokenCipher(
      process.env.ENCRYPTION_SECRET ??
        process.env.DELULU_LIVE_ENCRYPTION_SECRET ??
        ""
    )
  )
);

const PostgresConnectionStore = Layer.effect(
  ConnectionStore,
  makePostgresConnectionStore
).pipe(Layer.provide([Pg, Cipher]), Layer.orDie);

const providerSettings = (
  connectionId: string,
  settings: unknown
): ProviderSetting | undefined => {
  if (!settings || typeof settings !== "object") {
    return undefined;
  }
  const value = settings as { platform?: SocialType; values?: unknown };
  if (
    !value.platform ||
    value.platform === "DEFAULT" ||
    value.platform === "LENS"
  ) {
    return undefined;
  }
  return {
    socialProviderId: connectionId,
    type: value.platform,
    settings: value.values,
  } as ProviderSetting;
};

type PublishRunner = typeof runPublish;

/**
 * Minimal analytics sink for the SQS publish worker (plain Node/Lambda). The
 * Lambda handler injects a `posthog-node`-backed implementation and flushes
 * after the batch; passing it in keeps the pure publish transition testable and
 * lets tests run without any PostHog client. Left undefined ⇒ no-op.
 */
export interface WorkerTelemetry {
  readonly capture: (input: {
    readonly distinctId: string;
    readonly event: string;
    readonly properties?: Record<string, unknown>;
    readonly groups?: Record<string, string>;
  }) => void;
}

const processProgram = (
  message: PostgresMessage,
  publishRunner: PublishRunner,
  telemetry?: WorkerTelemetry
) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const rows = yield* sql<Record<string, unknown>>`
      SELECT t.id, t.post_id, t.connection_id, t.group_id, t.settings,
             t.provider_state, t.status,
             p.content, p.workspace_id, c.platform
      FROM post_targets t JOIN posts p ON p.id = t.post_id
      JOIN connections c ON c.id = t.connection_id
      WHERE t.id = ${message.targetId} AND p.deleted_at IS NULL`;
    const row = rows[0];
    if (!row) {
      yield* sql`UPDATE jobs SET status = 'failed', last_error = 'Target not found' WHERE id = ${message.jobId}`;
      return;
    }
    const jobs = yield* sql<{
      status: string;
    }>`SELECT status FROM jobs WHERE id = ${message.jobId}`;
    if (
      !(jobs[0] && ["leased", "dispatched"].includes(jobs[0].status)) ||
      row.status === "published"
    ) {
      return;
    }
    const failBeforePublish = (messageText: string) =>
      sql.withTransaction(
        Effect.gen(function* () {
          yield* sql`UPDATE post_targets SET status = 'failed', error = ${messageText}
            WHERE id = ${message.targetId}`;
          yield* sql`UPDATE jobs SET status = 'failed', locked_until = NULL,
            last_error = ${messageText} WHERE id = ${message.jobId}`;
          const statuses = yield* sql<{
            status: "pending" | "publishing" | "published" | "failed";
          }>`
            SELECT status FROM post_targets WHERE post_id = ${row.postId}`;
          yield* sql`UPDATE posts SET status = ${rollupPostStatus(statuses.map((entry) => entry.status))}::post_status
            WHERE id = ${row.postId}`;
        })
      );
    const content = row.content as {
      groups: Array<{
        id: string;
        segments: Array<{
          text: string;
          media: Array<{
            id: string;
            altText?: string;
            thumbnailMediaId?: string;
            thumbnailTimestamp?: number;
          }>;
          delayMinutes?: number;
        }>;
      }>;
    };
    const group = content.groups.find((entry) => entry.id === row.groupId);
    if (!group) {
      yield* failBeforePublish("Target content group not found");
      return;
    }
    const primaryMediaIds = group.segments.flatMap((segment) =>
      segment.media.map((item) => item.id)
    );
    const thumbnailMediaIds = group.segments.flatMap((segment) =>
      segment.media.flatMap((item) =>
        item.thumbnailMediaId ? [item.thumbnailMediaId] : []
      )
    );
    const mediaIds = [...primaryMediaIds, ...thumbnailMediaIds];
    const mediaRows =
      mediaIds.length === 0
        ? []
        : yield* sql<Record<string, unknown>>`
      SELECT id, url, bucket_key, media_type, mime_type, size_bytes, width, height,
             duration_seconds, alt_text, thumbnails FROM media
      WHERE id IN ${sql.in(mediaIds)} AND workspace_id = ${row.workspaceId}
        AND status = 'ready' AND deleted_at IS NULL`;
    const byMedia = new Map(
      mediaRows.map((media) => [String(media.id), media])
    );
    const missingMediaId = mediaIds.find((id) => !byMedia.has(id));
    if (missingMediaId) {
      yield* failBeforePublish(`Media ${missingMediaId} is not ready`);
      return;
    }
    const invalidThumbnailId = thumbnailMediaIds.find(
      (id) => String(byMedia.get(id)?.mediaType).toUpperCase() !== "IMAGE"
    );
    if (invalidThumbnailId) {
      yield* failBeforePublish(
        `Thumbnail ${invalidThumbnailId} must be an image`
      );
      return;
    }
    const publishInput: SocialPublishInputType = {
      postId: String(row.postId),
      socialProviderId: String(row.connectionId),
      content: group.segments.map((segment, index) => ({
        order: index,
        name: `Segment ${index + 1}`,
        text: segment.text,
        tags: [],
        media: segment.media.map((reference) => {
          const media = byMedia.get(reference.id);
          if (!media) {
            throw new Error("Validated media disappeared");
          }
          const thumbnail = reference.thumbnailMediaId
            ? byMedia.get(reference.thumbnailMediaId)
            : undefined;
          return {
            url: String(media.url),
            bucketUrl: String(media.url),
            bucketKey: String(media.bucketKey),
            mediaType: String(media.mediaType).toUpperCase() as
              | "IMAGE"
              | "VIDEO"
              | "DOCUMENT",
            altText:
              reference.altText ??
              (media.altText === null ? undefined : String(media.altText)),
            thumbnailBucketUrl:
              (thumbnail ? String(thumbnail.url) : undefined) ??
              (Array.isArray(media.thumbnails)
                ? String(media.thumbnails[0] ?? "") || undefined
                : undefined),
            thumbnailBucketKey: thumbnail
              ? String(thumbnail.bucketKey)
              : undefined,
            thumbnailTimestamp: reference.thumbnailTimestamp,
            durationSeconds:
              media.durationSeconds === null
                ? undefined
                : Number(media.durationSeconds),
          };
        }),
      })),
      providerSettings: providerSettings(
        String(row.connectionId),
        row.settings
      ),
    };
    const platform = String(row.platform) as Exclude<
      SocialType,
      "DEFAULT" | "LENS"
    >;
    let rules: ReturnType<typeof getConnection>["rules"];
    try {
      rules = getConnection(platform).rules;
    } catch {
      yield* failBeforePublish(`Unsupported platform ${platform}`);
      return;
    }
    for (const segment of publishInput.content) {
      const validation = rules.validate({
        text: segment.text,
        media: segment.media,
      });
      if (!validation.valid) {
        yield* failBeforePublish(
          `Platform validation failed: ${validation.errors.join("; ")}`
        );
        return;
      }
    }
    const acquired = yield* sql.withTransaction(
      Effect.gen(function* () {
        const targets = yield* sql<{
          status: string;
          updatedAt: Date;
        }>`SELECT status, updated_at FROM post_targets
          WHERE id = ${message.targetId} FOR UPDATE`;
        const target = targets[0];
        if (
          !target ||
          (target.status !== "pending" &&
            !(
              target.status === "publishing" &&
              target.updatedAt.getTime() < Date.now() - 15 * 60 * 1000
            ))
        ) {
          return false;
        }
        const durableJobs = yield* sql<{
          status: string;
        }>`SELECT status FROM jobs WHERE id = ${message.jobId} FOR UPDATE`;
        if (
          !(
            durableJobs[0] &&
            ["leased", "dispatched"].includes(durableJobs[0].status)
          )
        ) {
          return false;
        }
        yield* sql`UPDATE post_targets SET status = 'publishing', attempts = attempts + 1 WHERE id = ${message.targetId}`;
        yield* sql`UPDATE posts SET status = 'publishing' WHERE id = ${row.postId}`;
        return true;
      })
    );
    if (!acquired) {
      return;
    }
    const mediaResolution = yield* Effect.tryPromise(() =>
      resolveMediaUrls(publishInput)
    ).pipe(Effect.result);
    if (mediaResolution._tag === "Failure") {
      yield* failBeforePublish("Unable to resolve authoritative media URLs");
      return;
    }
    const outcome = yield* Effect.promise(() =>
      publishRunner(
        platform,
        {
          content: publishInput,
          socialProviderId: String(row.connectionId),
          providerState: row.providerState as Record<string, unknown>,
          persistProviderState: async (state) => {
            const updated = await Effect.runPromise(
              sql<{ id: string }>`UPDATE post_targets
                SET provider_state = ${JSON.stringify(state)}::jsonb
                WHERE id = ${message.targetId} AND status = 'publishing'
                RETURNING id`
            );
            if (updated.length !== 1) {
              throw new Error("Publish progress lease is no longer active");
            }
          },
        },
        PostgresConnectionStore
      )
    );
    yield* sql.withTransaction(
      Effect.gen(function* () {
        if (outcome.status === "PUBLISHED") {
          yield* sql`UPDATE post_targets SET status = 'published', platform_post_id = ${outcome.result.platformPostId},
            platform_post_url = ${outcome.result.platformPostUrl}, posted_at = now(), error = NULL WHERE id = ${message.targetId}`;
          const pendingAutomations = yield* sql<{
            id: string;
            triggers: unknown;
            enabled: boolean;
            profileId: string;
          }>`SELECT a.id, a.triggers, a.enabled, c.profile_id
              FROM automations a
              JOIN connections c ON c.id = a.connection_id
              WHERE a.workspace_id = ${row.workspaceId}
                AND a.connection_id = ${row.connectionId}
                AND EXISTS (
                  SELECT 1
                  FROM jsonb_array_elements(a.triggers) AS trigger
                  WHERE (trigger->'pendingPostIds') ? ${row.postId}
                )`;
          for (const automation of pendingAutomations) {
            yield* sql`UPDATE automations
                SET triggers = (
                  SELECT jsonb_agg(
                    CASE
                      WHEN (trigger->'pendingPostIds') ? ${row.postId}
                      THEN trigger || jsonb_build_object(
                        'targetMode', 'specific',
                        'targetPostIds',
                          COALESCE(trigger->'targetPostIds', '[]'::jsonb)
                          || jsonb_build_array(${outcome.result.platformPostId}),
                        'pendingPostIds',
                          COALESCE(trigger->'pendingPostIds', '[]'::jsonb)
                          - ${row.postId}
                      )
                      ELSE trigger
                    END
                  )
                  FROM jsonb_array_elements(automations.triggers) AS trigger
                )
                WHERE id = ${automation.id}`;
            yield* sql`INSERT INTO automation_trigger_index
                (automation_id, connection_id, profile_id, media_id, enabled)
                VALUES (
                  ${automation.id},
                  ${row.connectionId},
                  ${automation.profileId},
                  ${outcome.result.platformPostId},
                  ${automation.enabled}
                )
                ON CONFLICT (automation_id, media_id)
                DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = now()`;
            yield* sql`INSERT INTO automation_trigger_repairs
                (profile_id, media_id)
                VALUES (
                  ${automation.profileId},
                  ${outcome.result.platformPostId}
                )
                ON CONFLICT (profile_id, media_id)
                DO UPDATE SET requested_at = now()`;
          }
          yield* sql`UPDATE jobs SET status = 'completed', locked_until = NULL, last_error = NULL WHERE id = ${message.jobId}`;
          if (mediaIds.length > 0) {
            const subscriptions = yield* sql<{
              plan: string;
            }>`SELECT s.plan FROM workspaces w
              JOIN subscriptions s ON s.billing_owner_user_id = w.billing_owner_user_id
              WHERE w.id = ${row.workspaceId}`;
            const retentionDays = getPlanLimits(
              subscriptions[0]?.plan
            ).mediaRetentionDays;
            if (retentionDays !== null) {
              for (const mediaId of new Set(mediaIds)) {
                yield* sql`INSERT INTO jobs (id, workspace_id, payload, run_at, status, attempts, max_attempts, idempotency_key)
                  VALUES (${makeId(JobId)}, ${row.workspaceId}, ${JSON.stringify({ _tag: "ReclaimMedia", mediaId })}::jsonb,
                    now() + (${retentionDays} * interval '1 day'), 'pending', 0, 5, ${`reclaim-media:${mediaId}`})
                  ON CONFLICT (idempotency_key) DO UPDATE SET run_at = EXCLUDED.run_at, status = 'pending', attempts = 0,
                    locked_until = NULL, last_error = NULL`;
              }
            }
          }
        } else {
          yield* sql`UPDATE post_targets SET status = ${outcome.retryable ? "pending" : "failed"}::target_status,
            error = ${outcome.message} WHERE id = ${message.targetId}`;
          yield* sql`UPDATE jobs SET status = ${outcome.retryable ? "pending" : "failed"}::job_status,
            run_at = CASE WHEN ${outcome.retryable}
              THEN now() + (LEAST(300, power(2, attempts)::integer) * interval '1 second')
              ELSE run_at END,
            last_error = ${outcome.message}, locked_until = NULL WHERE id = ${message.jobId}`;
        }
        const statuses = yield* sql<{
          status: "pending" | "publishing" | "published" | "failed";
        }>`SELECT status FROM post_targets WHERE post_id = ${row.postId}`;
        const status = rollupPostStatus(statuses.map((entry) => entry.status));
        yield* sql`UPDATE posts SET status = ${status}::post_status,
          published_at = CASE WHEN ${status} IN ('published', 'partially_failed') THEN COALESCE(published_at, now()) ELSE published_at END
          WHERE id = ${row.postId}`;
      })
    );
    // Authoritative publish signal — this is the true status transition (apps/api
    // only forwards to SQS). Fired AFTER the transaction commits. We only emit for
    // terminal outcomes: a success, or a non-retryable failure — retryable
    // failures will be re-attempted, so counting them would inflate failures.
    if (telemetry) {
      const published = outcome.status === "PUBLISHED";
      const terminalFailure = outcome.status === "FAILED" && !outcome.retryable;
      if (published || terminalFailure) {
        const owners = yield* sql<{ billingOwnerUserId: string }>`
          SELECT billing_owner_user_id FROM workspaces WHERE id = ${row.workspaceId}`.pipe(
          Effect.catchCause(() =>
            Effect.succeed([] as { billingOwnerUserId: string }[])
          )
        );
        const distinctId = owners[0]?.billingOwnerUserId;
        if (distinctId) {
          yield* Effect.sync(() =>
            telemetry.capture({
              distinctId,
              event: published ? POST_PUBLISHED : POST_PUBLISH_FAILED,
              groups: { workspace: String(row.workspaceId) },
              properties: {
                platform: "worker",
                social_platform: platform,
                post_id: String(row.postId),
                ...(published ? {} : { error: outcome.message }),
              },
            })
          );
        }
      }
    }
    if (outcome.status === "FAILED" && outcome.retryable) {
      throw new Error(`Retryable publish failure: ${outcome.message}`);
    }
  });

export const processPostgresMessage = (
  messageBody: string,
  publishRunner: PublishRunner = runPublish,
  telemetry?: WorkerTelemetry
): Promise<void> => {
  let message: PostgresMessage;
  try {
    message = decodeMessage(messageBody);
  } catch {
    return Promise.reject(new Error("Invalid Postgres publish message"));
  }
  return Effect.runPromise(
    processProgram(message, publishRunner, telemetry).pipe(Effect.provide(Pg))
  );
};
