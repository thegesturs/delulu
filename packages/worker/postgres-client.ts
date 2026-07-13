import {
  getConnection,
  networkError,
  type SocialProviderTokens,
} from "@delulu/connections";
import { ConnectionStore, runPublish } from "@delulu/connections/worker";
import {
  JobId,
  makeId,
  makeTokenCipher,
  PostTargetId,
  rollupPostStatus,
  TokenCipher,
} from "@delulu/core";
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
    process.env.DATABASE_URL ?? "postgres://delulu:delulu@localhost:5432/delulu"
  ),
  maxConnections: 3,
  transformQueryNames: EffectString.camelToSnake,
  transformResultNames: EffectString.snakeToCamel,
  transformJson: true,
});
const Cipher = Layer.succeed(
  TokenCipher,
  TokenCipher.of(makeTokenCipher(process.env.ENCRYPTION_SECRET ?? ""))
);

const PostgresConnectionStore = Layer.effect(
  ConnectionStore,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const cipher = yield* TokenCipher;
    return ConnectionStore.of({
      getSocialProviderWithDecryptedTokens: (id) =>
        Effect.gen(function* () {
          const rows = yield* sql<
            Record<string, unknown>
          >`SELECT id, platform, access_token, refresh_token,
            cipher_version, profile_id, username, expires_at FROM connections WHERE id = ${id}`;
          const row = rows[0];
          if (!row) {
            return null;
          }
          const version = row.cipherVersion as "v1";
          const accessToken = yield* cipher.decrypt({
            ciphertext: String(row.accessToken),
            cipherVersion: version,
          });
          const refreshToken =
            row.refreshToken === null
              ? undefined
              : yield* cipher.decrypt({
                  ciphertext: String(row.refreshToken),
                  cipherVersion: version,
                });
          return {
            _id: String(row.id),
            socialType: String(
              row.platform
            ) as SocialProviderTokens["socialType"],
            accessToken,
            refreshToken,
            profileId: String(row.profileId),
            username: row.username === null ? undefined : String(row.username),
            expiresIn:
              row.expiresAt === null
                ? undefined
                : new Date(row.expiresAt as Date | string).getTime(),
          } satisfies SocialProviderTokens;
        }).pipe(
          Effect.mapError(() => networkError("Postgres", "load connection"))
        ),
      updateSocialProvider: (update) =>
        Effect.gen(function* () {
          const access = update.accessToken
            ? yield* cipher.encrypt(update.accessToken)
            : null;
          const refresh = update.refreshToken
            ? yield* cipher.encrypt(update.refreshToken)
            : null;
          yield* sql`UPDATE connections SET
            access_token = COALESCE(${access?.ciphertext ?? null}, access_token),
            refresh_token = COALESCE(${refresh?.ciphertext ?? null}, refresh_token),
            expires_at = COALESCE(${update.expiresIn ? new Date(update.expiresIn) : null}, expires_at)
            WHERE id = ${update.socialProviderId}`;
        }).pipe(
          Effect.asVoid,
          Effect.mapError(() => networkError("Postgres", "update connection"))
        ),
    });
  })
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

const processProgram = (
  message: PostgresMessage,
  publishRunner: PublishRunner
) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const rows = yield* sql<Record<string, unknown>>`
      SELECT t.id, t.post_id, t.connection_id, t.group_id, t.settings, t.status,
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
          media: Array<{ id: string; altText?: string }>;
          delayMinutes?: number;
        }>;
      }>;
    };
    const group = content.groups.find((entry) => entry.id === row.groupId);
    if (!group) {
      yield* failBeforePublish("Target content group not found");
      return;
    }
    const mediaIds = group.segments.flatMap((segment) =>
      segment.media.map((item) => item.id)
    );
    const mediaRows =
      mediaIds.length === 0
        ? []
        : yield* sql<Record<string, unknown>>`
      SELECT id, url, bucket_key, media_type, mime_type, size_bytes, width, height,
             duration_seconds, alt_text, thumbnails FROM media
      WHERE id IN ${sql.in(mediaIds)} AND status = 'ready' AND deleted_at IS NULL`;
    const byMedia = new Map(
      mediaRows.map((media) => [String(media.id), media])
    );
    const missingMediaId = mediaIds.find((id) => !byMedia.has(id));
    if (missingMediaId) {
      yield* failBeforePublish(`Media ${missingMediaId} is not ready`);
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
            thumbnailBucketUrl: Array.isArray(media.thumbnails)
              ? String(media.thumbnails[0] ?? "") || undefined
              : undefined,
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
        },
        PostgresConnectionStore
      )
    );
    yield* sql.withTransaction(
      Effect.gen(function* () {
        if (outcome.status === "PUBLISHED") {
          yield* sql`UPDATE post_targets SET status = 'published', platform_post_id = ${outcome.result.platformPostId},
            platform_post_url = ${outcome.result.platformPostUrl}, posted_at = now(), error = NULL WHERE id = ${message.targetId}`;
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
          yield* sql`UPDATE jobs SET status = ${outcome.retryable ? "dispatched" : "failed"}::job_status,
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
    if (outcome.status === "FAILED" && outcome.retryable) {
      throw new Error(`Retryable publish failure: ${outcome.message}`);
    }
  });

export const processPostgresMessage = (
  messageBody: string,
  publishRunner: PublishRunner = runPublish
): Promise<void> => {
  let message: PostgresMessage;
  try {
    message = decodeMessage(messageBody);
  } catch {
    return Promise.reject(new Error("Invalid Postgres publish message"));
  }
  return Effect.runPromise(
    processProgram(message, publishRunner).pipe(Effect.provide(Pg))
  );
};
