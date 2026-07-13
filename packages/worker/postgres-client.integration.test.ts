import {
  ConnectionId,
  JobId,
  MediaId,
  MemberId,
  makeId,
  PostGroupId,
  PostId,
  PostTargetId,
  SubscriptionId,
  UserId,
  WorkspaceId,
} from "@delulu/core";
import { PgClient } from "@effect/sql-pg";
import { Effect, Redacted } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { describe, expect, it } from "vitest";
import { processPostgresMessage } from "./postgres-client";

const Pg = PgClient.layer({
  url: Redacted.make(
    process.env.DATABASE_URL ?? "postgres://delulu:delulu@localhost:5433/delulu"
  ),
});

const seed = (text: string, withThumbnail = false) =>
  Effect.runPromise(
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const userId = makeId(UserId);
      const workspaceId = makeId(WorkspaceId);
      const memberId = makeId(MemberId);
      const connectionId = makeId(ConnectionId);
      const postId = makeId(PostId);
      const targetId = makeId(PostTargetId);
      const jobId = makeId(JobId);
      const groupId = makeId(PostGroupId);
      const mediaId = makeId(MediaId);
      const thumbnailMediaId = makeId(MediaId);
      yield* sql`INSERT INTO users (id, external_id) VALUES (${userId}, ${`worker-${crypto.randomUUID()}`})`;
      yield* sql`INSERT INTO workspaces (id, name, billing_owner_user_id, is_personal) VALUES (${workspaceId}, 'Worker', ${userId}, true)`;
      yield* sql`INSERT INTO workspace_members (id, workspace_id, user_id, role) VALUES (${memberId}, ${workspaceId}, ${userId}, 'owner')`;
      yield* sql`INSERT INTO subscriptions (id, billing_owner_user_id, plan, status) VALUES (${makeId(SubscriptionId)}, ${userId}, 'VIBE', 'active')`;
      yield* sql`INSERT INTO connections (id, workspace_id, platform, profile_id, access_token) VALUES (${connectionId}, ${workspaceId}, 'TWITTER', ${crypto.randomUUID()}, 'unused')`;
      if (withThumbnail) {
        yield* sql`INSERT INTO media (id, workspace_id, bucket_key, url, media_type, mime_type, size_bytes, status)
          VALUES (${mediaId}, ${workspaceId}, 'video.mp4', 'https://example.test/video.mp4', 'video', 'video/mp4', 100, 'ready'),
                 (${thumbnailMediaId}, ${workspaceId}, 'cover.jpg', 'https://example.test/cover.jpg', 'image', 'image/jpeg', 10, 'ready')`;
      }
      yield* sql`INSERT INTO posts (id, workspace_id, status, content, created_by_member_id, source)
    VALUES (${postId}, ${workspaceId}, 'scheduled', ${JSON.stringify({ groups: [{ id: groupId, isDefault: true, segments: [{ text, media: withThumbnail ? [{ id: mediaId, thumbnailMediaId }] : [] }] }] })}::jsonb, ${memberId}, 'api')`;
      yield* sql`INSERT INTO post_targets (id, post_id, connection_id, group_id, settings, status)
      VALUES (${targetId}, ${postId}, ${connectionId}, ${groupId}, ${JSON.stringify({ platform: "TWITTER", values: {} })}::jsonb, 'pending')`;
      yield* sql`INSERT INTO jobs (id, workspace_id, payload, run_at, status, attempts, max_attempts, idempotency_key)
    VALUES (${jobId}, ${workspaceId}, ${JSON.stringify({ _tag: "PublishTarget", targetId })}::jsonb, now(), 'dispatched', 1, 5, ${`worker-${jobId}`})`;
      return { sql, jobId, targetId, postId, mediaId, thumbnailMediaId };
    }).pipe(Effect.provide(Pg))
  );

describe("Postgres publish worker outcomes", () => {
  it("passes a post-specific thumbnail image to the publisher", async () => {
    const seeded = await seed("publish with cover", true);
    let receivedThumbnail: string | undefined;
    await processPostgresMessage(
      JSON.stringify({ jobId: seeded.jobId, targetId: seeded.targetId }),
      async (_platform, context) => {
        receivedThumbnail =
          context.content.content[0]?.media[0]?.thumbnailBucketUrl;
        return {
          status: "PUBLISHED",
          result: {
            platformPostId: "remote-cover",
            platformPostUrl: "https://example.test/remote-cover",
            platformId: "TWITTER",
            postId: seeded.postId,
            postedAt: new Date(),
          },
        };
      }
    );

    expect(receivedThumbnail).toBe("https://example.test/cover.jpg");
  });

  it("records success transactionally and ignores duplicate delivery", async () => {
    const seeded = await seed("publish me");
    let calls = 0;
    const publish = async () => {
      calls += 1;
      return {
        status: "PUBLISHED" as const,
        result: {
          platformPostId: "remote-1",
          platformPostUrl: "https://example.test/remote-1",
          platformId: "INSTAGRAM",
          postId: seeded.postId,
          postedAt: new Date(),
        },
      };
    };
    const body = JSON.stringify({
      jobId: seeded.jobId,
      targetId: seeded.targetId,
    });
    await processPostgresMessage(body, publish);
    await processPostgresMessage(body, publish);
    const state = await Effect.runPromise(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient;
        return yield* sql<{
          target: string;
          job: string;
          post: string;
        }>`SELECT t.status AS target, j.status AS job, p.status AS post
        FROM post_targets t JOIN jobs j ON j.id = ${seeded.jobId} JOIN posts p ON p.id = t.post_id WHERE t.id = ${seeded.targetId}`;
      }).pipe(Effect.provide(Pg))
    );
    expect(calls).toBe(1);
    expect(state[0]).toMatchObject({
      target: "published",
      job: "completed",
      post: "published",
    });
  });

  it("records permanent platform validation failures", async () => {
    const seeded = await seed("x".repeat(5000));
    await processPostgresMessage(
      JSON.stringify({ jobId: seeded.jobId, targetId: seeded.targetId }),
      async () => {
        throw new Error("publisher must not run");
      }
    );
    const state = await Effect.runPromise(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient;
        return yield* sql<{
          target: string;
          job: string;
        }>`SELECT t.status AS target, j.status AS job FROM post_targets t JOIN jobs j ON j.id = ${seeded.jobId} WHERE t.id = ${seeded.targetId}`;
      }).pipe(Effect.provide(Pg))
    );
    expect(state[0]).toMatchObject({ target: "failed", job: "failed" });
  });

  it("keeps retryable publish failures eligible for SQS redelivery", async () => {
    const seeded = await seed("retry me");
    await expect(
      processPostgresMessage(
        JSON.stringify({ jobId: seeded.jobId, targetId: seeded.targetId }),
        async () => ({
          status: "FAILED",
          message: "temporary outage",
          retryable: true,
        })
      )
    ).rejects.toThrow("Retryable publish failure");
    const state = await Effect.runPromise(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient;
        return yield* sql<{
          target: string;
          job: string;
        }>`SELECT t.status AS target, j.status AS job FROM post_targets t JOIN jobs j ON j.id = ${seeded.jobId} WHERE t.id = ${seeded.targetId}`;
      }).pipe(Effect.provide(Pg))
    );
    expect(state[0]).toMatchObject({ target: "pending", job: "dispatched" });
  });

  it("does not publish an SQS delivery whose durable job was cancelled", async () => {
    const seeded = await seed("cancel me");
    await Effect.runPromise(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient;
        yield* sql`DELETE FROM jobs WHERE id = ${seeded.jobId}`;
      }).pipe(Effect.provide(Pg))
    );
    let calls = 0;
    await processPostgresMessage(
      JSON.stringify({ jobId: seeded.jobId, targetId: seeded.targetId }),
      async () => {
        calls += 1;
        return { status: "FAILED", message: "must not run", retryable: false };
      }
    );
    expect(calls).toBe(0);
  });
});
