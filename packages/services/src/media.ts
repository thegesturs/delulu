import {
  type ConflictError,
  type MediaView,
  NotFoundError,
  type QuotaExceededError,
} from "@delulu/contracts";
import { MediaId, makeId, type WorkspaceId } from "@delulu/core";
import { Context, Effect, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { JobService } from "./jobs";
import { QuotaGuard } from "./quota";
import { R2Service } from "./r2";

type MediaOutput = typeof MediaView.Type;
const mediaTypeFor = (contentType: string): MediaOutput["mediaType"] => {
  if (contentType.startsWith("image/")) {
    return "image";
  }
  if (contentType.startsWith("video/")) {
    return "video";
  }
  return "document";
};
const mediaRow = (row: Record<string, unknown>): MediaOutput => ({
  id: String(row.id),
  bucketKey: String(row.bucketKey),
  url: String(row.url),
  mediaType: row.mediaType as MediaOutput["mediaType"],
  mimeType: row.mimeType === null ? null : String(row.mimeType),
  sizeBytes: String(row.sizeBytes),
  width: row.width === null ? null : Number(row.width),
  height: row.height === null ? null : Number(row.height),
  durationSeconds:
    row.durationSeconds === null ? null : Number(row.durationSeconds),
  thumbnails: row.thumbnails as readonly string[],
  altText: row.altText === null ? null : String(row.altText),
  status: row.status as MediaOutput["status"],
  createdAt: new Date(row.createdAt as string | Date).toISOString(),
});

export class MediaService extends Context.Service<
  MediaService,
  {
    readonly list: (
      workspaceId: WorkspaceId,
      limit: number,
      offset: number
    ) => Effect.Effect<{
      data: readonly MediaOutput[];
      total: number;
      limit: number;
      offset: number;
    }>;
    readonly get: (
      workspaceId: WorkspaceId,
      mediaId: string
    ) => Effect.Effect<MediaOutput, NotFoundError>;
    readonly createUploads: (input: {
      workspaceId: WorkspaceId;
      billingOwnerUserId: string;
      files: readonly {
        filename: string;
        contentType: string;
        width?: number;
        height?: number;
        durationSeconds?: number;
        thumbnails?: readonly string[];
        altText?: string;
      }[];
    }) => Effect.Effect<
      readonly { mediaId: string; bucketKey: string; uploadUrl: string }[],
      ConflictError | QuotaExceededError
    >;
    readonly complete: (input: {
      workspaceId: WorkspaceId;
      billingOwnerUserId: string;
      mediaIds: readonly string[];
    }) => Effect.Effect<
      readonly MediaOutput[],
      ConflictError | NotFoundError | QuotaExceededError
    >;
    readonly remove: (
      workspaceId: WorkspaceId,
      mediaId: string
    ) => Effect.Effect<void, NotFoundError>;
  }
>()("@delulu/services/MediaService") {
  static readonly layer = Layer.effect(
    MediaService,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const r2 = yield* R2Service;
      const quota = yield* QuotaGuard;
      const jobs = yield* JobService;
      const list = Effect.fn("MediaService.list")(function* (
        workspaceId: WorkspaceId,
        limit: number,
        offset: number
      ) {
        const rows = yield* sql<
          Record<string, unknown>
        >`SELECT id, bucket_key, url, media_type, mime_type,
          size_bytes::text, width, height, duration_seconds, thumbnails, alt_text, status, created_at
          FROM media WHERE workspace_id = ${workspaceId} AND deleted_at IS NULL ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}`.pipe(Effect.orDie);
        const totals = yield* sql<{
          count: string;
        }>`SELECT count(*)::text AS count FROM media WHERE workspace_id = ${workspaceId} AND deleted_at IS NULL`.pipe(
          Effect.orDie
        );
        return {
          data: rows.map(mediaRow),
          total: Number(totals[0]?.count ?? 0),
          limit,
          offset,
        };
      });
      const createUploads = Effect.fn("MediaService.createUploads")(
        function* (input: {
          workspaceId: WorkspaceId;
          billingOwnerUserId: string;
          files: readonly {
            filename: string;
            contentType: string;
            width?: number;
            height?: number;
            durationSeconds?: number;
            thumbnails?: readonly string[];
            altText?: string;
          }[];
        }) {
          yield* quota.ensure({
            resource: "mediaStorageBytes",
            billingOwnerUserId: input.billingOwnerUserId,
          });
          const outputs: {
            mediaId: string;
            bucketKey: string;
            uploadUrl: string;
          }[] = [];
          for (const file of input.files) {
            const mediaId = makeId(MediaId);
            const extension = file.filename.includes(".")
              ? file.filename
                  .slice(file.filename.lastIndexOf("."))
                  .replace(/[^.a-zA-Z0-9]/g, "")
              : "";
            const bucketKey = `${input.workspaceId}/${mediaId}${extension}`;
            const uploadUrl = yield* r2.presignPut(bucketKey);
            yield* sql`INSERT INTO media
            (id, workspace_id, bucket_key, url, media_type, mime_type, size_bytes, width, height,
             duration_seconds, thumbnails, alt_text, status)
            VALUES (${mediaId}, ${input.workspaceId}, ${bucketKey}, ${r2.publicUrl(bucketKey)},
              ${mediaTypeFor(file.contentType)}, ${file.contentType}, 0, ${file.width ?? null}, ${file.height ?? null},
              ${file.durationSeconds ?? null}, ${JSON.stringify(file.thumbnails ?? [])}::jsonb, ${file.altText ?? null}, 'pending')`.pipe(
              Effect.orDie
            );
            outputs.push({ mediaId, bucketKey, uploadUrl });
          }
          yield* jobs.enqueue({
            workspaceId: input.workspaceId,
            payload: { _tag: "SweepPendingMedia" },
            runAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
            idempotencyKey: `sweep-pending:${input.workspaceId}:${new Date().toISOString().slice(0, 10)}`,
          });
          return outputs;
        }
      );
      const complete = Effect.fn("MediaService.complete")(function* (input: {
        workspaceId: WorkspaceId;
        billingOwnerUserId: string;
        mediaIds: readonly string[];
      }) {
        const rows =
          input.mediaIds.length === 0
            ? []
            : yield* sql<
                Record<string, unknown>
              >`SELECT id, bucket_key, size_bytes::text, status FROM media
          WHERE id IN ${sql.in(input.mediaIds)} AND workspace_id = ${input.workspaceId} AND deleted_at IS NULL`.pipe(
                Effect.orDie
              );
        if (rows.length !== new Set(input.mediaIds).size) {
          return yield* new NotFoundError({
            message: "Media not found",
            resource: "media",
          });
        }
        for (const row of rows) {
          const id = String(row.id);
          if (row.status !== "ready") {
            const metadata = yield* r2.head(String(row.bucketKey));
            const previous = Number(row.sizeBytes ?? 0);
            yield* sql
              .withTransaction(
                Effect.gen(function* () {
                  yield* quota.reserveMediaStorage({
                    billingOwnerUserId: input.billingOwnerUserId,
                    delta: Math.max(0, metadata.size - previous),
                  });
                  yield* sql`UPDATE media SET status = 'ready', size_bytes = ${metadata.size}, mime_type = ${metadata.contentType},
                  media_type = ${mediaTypeFor(metadata.contentType)} WHERE id = ${id}`;
                })
              )
              .pipe(Effect.catchTag("SqlError", Effect.die));
          }
        }
        const completedRows =
          input.mediaIds.length === 0
            ? []
            : yield* sql<
                Record<string, unknown>
              >`SELECT id, bucket_key, url, media_type, mime_type,
          size_bytes::text, width, height, duration_seconds, thumbnails, alt_text, status, created_at
          FROM media WHERE id IN ${sql.in(input.mediaIds)} AND workspace_id = ${input.workspaceId}`.pipe(
                Effect.orDie
              );
        return completedRows.map(mediaRow);
      });
      const get = Effect.fn("MediaService.get")(function* (
        workspaceId: WorkspaceId,
        mediaId: string
      ) {
        const rows = yield* sql<
          Record<string, unknown>
        >`SELECT id, bucket_key, url, media_type, mime_type,
          size_bytes::text, width, height, duration_seconds, thumbnails, alt_text, status, created_at
          FROM media WHERE id = ${mediaId} AND workspace_id = ${workspaceId} AND deleted_at IS NULL`.pipe(
          Effect.orDie
        );
        if (!rows[0]) {
          return yield* new NotFoundError({
            message: "Media not found",
            resource: "media",
          });
        }
        return mediaRow(rows[0]);
      });
      const remove = Effect.fn("MediaService.remove")(function* (
        workspaceId: WorkspaceId,
        mediaId: string
      ) {
        const rows = yield* sql<{
          id: string;
        }>`SELECT id FROM media WHERE id = ${mediaId}
          AND workspace_id = ${workspaceId} AND deleted_at IS NULL`.pipe(
          Effect.orDie
        );
        if (rows.length === 0) {
          return yield* new NotFoundError({
            message: "Media not found",
            resource: "media",
          });
        }
        yield* jobs.enqueue({
          workspaceId,
          payload: {
            _tag: "ReclaimMedia",
            mediaId: mediaId as typeof MediaId.Type,
          },
          runAt: new Date(),
          idempotencyKey: `reclaim-media:${mediaId}`,
        });
      });
      return MediaService.of({ list, get, createUploads, complete, remove });
    })
  );
}
