import {
  Connection,
  ConnectionId,
  makeConnectionRepository,
  makeId,
  makeTokenCipher,
  PostGroupId,
  TokenCipher,
} from "@delulu/core";
import { PgClient } from "@effect/sql-pg";
import {
  Effect,
  String as EffectString,
  Layer,
  Option,
  Redacted,
} from "effect";
import { SqlClient } from "effect/unstable/sql";
import { beforeAll, describe, expect, it } from "vitest";
import { AutomationKvService } from "../../src/automation-kv";
import {
  ConnectionStateConfig,
  ConnectionStateService,
  ConnectionsService,
} from "../../src/connections";
import { IdentityService } from "../../src/identity";
import { JobService } from "../../src/jobs";
import { LifecycleService } from "../../src/lifecycle";
import { MembershipService } from "../../src/membership";
import { PostService } from "../../src/posts";
import { ReviewService } from "../../src/reviews";

const Pg = PgClient.layer({
  url: Redacted.make(
    process.env.DATABASE_URL ?? "postgres://delulu:delulu@localhost:5432/delulu"
  ),
  transformQueryNames: EffectString.camelToSnake,
  transformResultNames: EffectString.snakeToCamel,
  transformJson: true,
});

let AppLayer: Layer.Layer<
  | IdentityService
  | MembershipService
  | JobService
  | PostService
  | ReviewService
  | ConnectionsService
  | PgClient.PgClient
>;

beforeAll(() => {
  const Jobs = JobService.layer;
  const Posts = PostService.layer.pipe(Layer.provide(Jobs));
  const Reviews = ReviewService.layer.pipe(Layer.provide(Jobs));
  const StateConfig = Layer.succeed(
    ConnectionStateConfig,
    ConnectionStateConfig.of({ secret: "integration-state-secret" })
  );
  const State = ConnectionStateService.layer.pipe(Layer.provide(StateConfig));
  const Cipher = Layer.succeed(
    TokenCipher,
    TokenCipher.of(makeTokenCipher("integration-encryption-secret"))
  );
  const TemporaryStore = AutomationKvService.memoryLayer();
  const Lifecycle = Layer.succeed(
    LifecycleService,
    LifecycleService.of({
      record: () => Effect.void,
      syncWorkspace: () => Effect.void,
      runScheduled: () => Effect.void,
    })
  );
  const Connections = ConnectionsService.layer.pipe(
    Layer.provide([State, Cipher, TemporaryStore, Lifecycle])
  );
  AppLayer = Layer.mergeAll(
    IdentityService.layer,
    MembershipService.layer,
    Jobs,
    Posts,
    Reviews,
    Connections
  ).pipe(Layer.provideMerge(Pg));
});

describe("M2 PostService and JobService", () => {
  it("atomically creates a scheduled post, target, and idempotent publish job", async () => {
    const externalSubmissionId = `submission-${crypto.randomUUID()}`;
    const program = Effect.gen(function* () {
      const identity = yield* IdentityService;
      const memberships = yield* MembershipService;
      const posts = yield* PostService;
      const connectionRepo = yield* makeConnectionRepository();
      const resolved = yield* identity.resolve({
        sub: `clerk_${crypto.randomUUID()}`,
      });
      const workspaceId = resolved.personalWorkspace?.id;
      if (!workspaceId) {
        return yield* Effect.die("missing personal workspace");
      }
      const member = Option.getOrThrow(
        yield* memberships.resolve({ workspaceId, userId: resolved.user.id })
      );
      const connection = yield* connectionRepo.insert(
        Connection.insert.make({
          id: makeId(ConnectionId),
          legacyConvexId: null,
          workspaceId,
          platform: "INSTAGRAM",
          profileId: crypto.randomUUID(),
          username: "publisher",
          displayName: "Publisher",
          accessToken: "opaque",
          refreshToken: null,
          cipherVersion: "v1",
          expiresAt: null,
          metadata: {},
        })
      );
      const groupId = makeId(PostGroupId);
      const value = {
        groups: [
          {
            id: groupId,
            isDefault: true,
            segments: [{ text: "Scheduled", media: [] }],
          },
        ],
        targets: [
          {
            connectionId: connection.id,
            groupId,
            settings: {
              platform: "INSTAGRAM" as const,
              values: {
                shareToFeed: true,
                shareToStory: false,
                trialReels: false,
                graduationStrategy: "MANUAL" as const,
              },
            },
            scheduledAt: new Date(Date.now() + 60_000).toISOString(),
          },
        ],
        source: "api" as const,
        externalSubmissionId,
      };
      const actor = { memberId: member.memberId, role: member.role };
      const first = yield* posts.create({ workspaceId, actor, value });
      const second = yield* posts.create({ workspaceId, actor, value });
      return { first, second };
    });
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(AppLayer))
    );
    expect(result.first.id).toBe(result.second.id);
    expect(result.first.status).toBe("scheduled");
    expect(result.first.targets).toHaveLength(1);
  });

  it("atomically creates publish-now posts without replacing their target", async () => {
    const program = Effect.gen(function* () {
      const identity = yield* IdentityService;
      const memberships = yield* MembershipService;
      const posts = yield* PostService;
      const sql = yield* SqlClient.SqlClient;
      const connectionRepo = yield* makeConnectionRepository();
      const resolved = yield* identity.resolve({
        sub: `clerk_${crypto.randomUUID()}`,
      });
      const workspaceId = resolved.personalWorkspace?.id;
      if (!workspaceId) {
        return yield* Effect.die("missing personal workspace");
      }
      const member = Option.getOrThrow(
        yield* memberships.resolve({ workspaceId, userId: resolved.user.id })
      );
      const connection = yield* connectionRepo.insert(
        Connection.insert.make({
          id: makeId(ConnectionId),
          legacyConvexId: null,
          workspaceId,
          platform: "LINKEDIN",
          profileId: crypto.randomUUID(),
          username: "atomic-publisher",
          displayName: "Atomic Publisher",
          accessToken: "opaque",
          refreshToken: null,
          cipherVersion: "v1",
          expiresAt: null,
          metadata: {},
        })
      );
      const groupId = makeId(PostGroupId);
      const actor = { memberId: member.memberId, role: member.role };
      const value = {
        groups: [
          {
            id: groupId,
            isDefault: true,
            segments: [{ text: "Publish exactly once", media: [] }],
          },
        ],
        targets: [
          {
            connectionId: connection.id,
            groupId,
            settings: {
              platform: "LINKEDIN" as const,
              values: { visibility: "PUBLIC" as const },
            },
            scheduledAt: null,
          },
        ],
        intent: "publish_now" as const,
        source: "api" as const,
        externalSubmissionId: `publish-once-${crypto.randomUUID()}`,
      };
      const created = yield* posts.create({
        workspaceId,
        actor,
        value,
      });
      const duplicateCreate = yield* posts.create({
        workspaceId,
        actor,
        value,
      });
      const repeated = yield* posts.publishNow({
        workspaceId,
        postId: created.id,
        actor,
      });
      const counts = yield* sql<{
        targets: string;
        jobs: string;
      }>`SELECT
          (SELECT count(*)::text FROM post_targets WHERE post_id = ${created.id}) AS targets,
          (SELECT count(*)::text FROM jobs
            WHERE idempotency_key = ${`publish-target:${created.targets[0]?.id}`}) AS jobs`;
      return { created, duplicateCreate, repeated, counts: counts[0] };
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(AppLayer))
    );
    expect(result.created.status).toBe("publishing");
    expect(result.duplicateCreate.id).toBe(result.created.id);
    expect(result.duplicateCreate.targets[0]?.id).toBe(
      result.created.targets[0]?.id
    );
    expect(result.repeated.status).toBe("publishing");
    expect(result.repeated.targets[0]?.id).toBe(result.created.targets[0]?.id);
    expect(result.counts).toEqual({ targets: "1", jobs: "1" });
  });

  it("leases a due job once so concurrent dispatchers cannot double-claim it", async () => {
    const program = Effect.gen(function* () {
      const identity = yield* IdentityService;
      const jobs = yield* JobService;
      const resolved = yield* identity.resolve({
        sub: `clerk_${crypto.randomUUID()}`,
      });
      const workspaceId = resolved.personalWorkspace?.id;
      if (!workspaceId) {
        return yield* Effect.die("missing workspace");
      }
      const id = yield* jobs.enqueue({
        workspaceId,
        payload: { _tag: "SweepPendingMedia" },
        runAt: new Date(Date.now() - 1000),
        idempotencyKey: `claim-${crypto.randomUUID()}`,
      });
      const first = yield* jobs.claimDue({ limit: 100, leaseSeconds: 60 });
      const second = yield* jobs.claimDue({ limit: 100, leaseSeconds: 60 });
      return { id, first, second };
    });
    const { id, first, second } = await Effect.runPromise(
      program.pipe(Effect.provide(AppLayer))
    );
    expect(first.some((job) => job.id === id)).toBe(true);
    expect(second.some((job) => job.id === id)).toBe(false);
  });

  it("re-dispatches an expired delivery lease and fails it after max attempts", async () => {
    const program = Effect.gen(function* () {
      const identity = yield* IdentityService;
      const jobs = yield* JobService;
      const sql = yield* SqlClient.SqlClient;
      const resolved = yield* identity.resolve({
        sub: `clerk_${crypto.randomUUID()}`,
      });
      const workspaceId = resolved.personalWorkspace?.id;
      if (!workspaceId) {
        return yield* Effect.die("missing workspace");
      }
      const id = yield* jobs.enqueue({
        workspaceId,
        payload: { _tag: "SweepPendingMedia" },
        runAt: new Date(Date.now() - 1000),
        idempotencyKey: `redispatch-${crypto.randomUUID()}`,
        maxAttempts: 2,
      });
      const first = yield* jobs.claimDue({ limit: 100, leaseSeconds: 60 });
      yield* jobs.markDispatched(id);
      yield* sql`UPDATE jobs SET locked_until = now() - interval '1 second' WHERE id = ${id}`;
      const second = yield* jobs.claimDue({ limit: 100, leaseSeconds: 60 });
      yield* jobs.markDispatched(id);
      yield* sql`UPDATE jobs SET locked_until = now() - interval '1 second' WHERE id = ${id}`;
      const exhausted = yield* jobs.claimDue({ limit: 100, leaseSeconds: 60 });
      const rows = yield* sql<{
        status: string;
      }>`SELECT status FROM jobs WHERE id = ${id}`;
      return { id, first, second, exhausted, status: rows[0]?.status };
    });
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(AppLayer))
    );
    expect(result.first.some((job) => job.id === result.id)).toBe(true);
    expect(result.second.some((job) => job.id === result.id)).toBe(true);
    expect(result.exhausted.some((job) => job.id === result.id)).toBe(false);
    expect(result.status).toBe("failed");
  });

  it("reschedules only missed targets when approving a delayed review", async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000);
    const program = Effect.gen(function* () {
      const identity = yield* IdentityService;
      const memberships = yield* MembershipService;
      const posts = yield* PostService;
      const reviews = yield* ReviewService;
      const sql = yield* SqlClient.SqlClient;
      const connectionRepo = yield* makeConnectionRepository();
      const resolved = yield* identity.resolve({
        sub: `clerk_${crypto.randomUUID()}`,
      });
      const workspaceId = resolved.personalWorkspace?.id;
      if (!workspaceId) {
        return yield* Effect.die("missing workspace");
      }
      const member = Option.getOrThrow(
        yield* memberships.resolve({ workspaceId, userId: resolved.user.id })
      );
      const connection = yield* connectionRepo.insert(
        Connection.insert.make({
          id: makeId(ConnectionId),
          legacyConvexId: null,
          workspaceId,
          platform: "INSTAGRAM",
          profileId: crypto.randomUUID(),
          username: "review-schedules",
          displayName: null,
          accessToken: "opaque",
          refreshToken: null,
          cipherVersion: "v1",
          expiresAt: null,
          metadata: {},
        })
      );
      const secondConnection = yield* connectionRepo.insert(
        Connection.insert.make({
          id: makeId(ConnectionId),
          legacyConvexId: null,
          workspaceId,
          platform: "INSTAGRAM",
          profileId: crypto.randomUUID(),
          username: "review-schedules-future",
          displayName: null,
          accessToken: "opaque",
          refreshToken: null,
          cipherVersion: "v1",
          expiresAt: null,
          metadata: {},
        })
      );
      const groupId = makeId(PostGroupId);
      const settings = {
        platform: "INSTAGRAM" as const,
        values: {
          shareToFeed: true,
          shareToStory: false,
          trialReels: false,
          graduationStrategy: "MANUAL" as const,
        },
      };
      const post = yield* posts.create({
        workspaceId,
        actor: { memberId: member.memberId, role: "editor" },
        value: {
          groups: [
            {
              id: groupId,
              isDefault: true,
              segments: [{ text: "Mixed schedules", media: [] }],
            },
          ],
          targets: [
            {
              connectionId: connection.id,
              groupId,
              settings,
              scheduledAt: new Date(Date.now() - 60_000).toISOString(),
            },
            {
              connectionId: secondConnection.id,
              groupId,
              settings,
              scheduledAt: future.toISOString(),
            },
          ],
          source: "api",
        },
      });
      yield* reviews.act({
        workspaceId,
        postId: post.id,
        memberId: member.memberId,
        role: "owner",
        action: { action: "approve", missedSlot: "publish_now" },
      });
      return yield* sql<{
        id: string;
        scheduledAt: Date | null;
      }>`SELECT id, scheduled_at FROM post_targets WHERE post_id = ${post.id}
          ORDER BY scheduled_at`;
    });
    const targets = await Effect.runPromise(
      program.pipe(Effect.provide(AppLayer))
    );
    expect(targets).toHaveLength(2);
    expect(targets[0]?.scheduledAt?.getTime()).toBeLessThan(future.getTime());
    expect(targets[1]?.scheduledAt?.toISOString()).toBe(future.toISOString());
  });

  it("always routes editor scheduling through review without a publish job", async () => {
    const program = Effect.gen(function* () {
      const identity = yield* IdentityService;
      const memberships = yield* MembershipService;
      const posts = yield* PostService;
      const sql = yield* SqlClient.SqlClient;
      const connectionRepo = yield* makeConnectionRepository();
      const resolved = yield* identity.resolve({
        sub: `clerk_${crypto.randomUUID()}`,
      });
      const workspaceId = resolved.personalWorkspace?.id;
      if (!workspaceId) {
        return yield* Effect.die("missing workspace");
      }
      const member = Option.getOrThrow(
        yield* memberships.resolve({ workspaceId, userId: resolved.user.id })
      );
      const connection = yield* connectionRepo.insert(
        Connection.insert.make({
          id: makeId(ConnectionId),
          legacyConvexId: null,
          workspaceId,
          platform: "INSTAGRAM",
          profileId: crypto.randomUUID(),
          username: "editor-target",
          displayName: null,
          accessToken: "opaque",
          refreshToken: null,
          cipherVersion: "v1",
          expiresAt: null,
          metadata: {},
        })
      );
      const groupId = makeId(PostGroupId);
      const post = yield* posts.create({
        workspaceId,
        actor: { memberId: member.memberId, role: "editor" },
        value: {
          groups: [
            {
              id: groupId,
              isDefault: true,
              segments: [{ text: "Needs approval", media: [] }],
            },
          ],
          targets: [
            {
              connectionId: connection.id,
              groupId,
              settings: {
                platform: "INSTAGRAM",
                values: {
                  shareToFeed: true,
                  shareToStory: false,
                  trialReels: false,
                  graduationStrategy: "MANUAL",
                },
              },
              scheduledAt: new Date(Date.now() + 60_000).toISOString(),
            },
          ],
          source: "api",
        },
      });
      const queued = yield* sql<{
        count: string;
      }>`SELECT count(*)::text AS count FROM jobs WHERE payload ->> 'targetId' = ${post.targets[0]?.id}`;
      yield* posts.updateTarget({
        workspaceId,
        postId: post.id,
        targetId: post.targets[0]?.id ?? "",
        scheduledAt: null,
        actor: { memberId: member.memberId, role: "editor" },
      });
      const reviews = yield* sql<{
        status: string;
      }>`SELECT status FROM post_reviews WHERE post_id = ${post.id}`;
      return {
        post,
        queued: Number(queued[0]?.count ?? 0),
        reviewStatus: reviews[0]?.status,
      };
    });
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(AppLayer))
    );
    expect(result.post.status).toBe("pending_review");
    expect(result.queued).toBe(0);
    expect(result.reviewStatus).toBe("rejected");
  });

  it("moves an existing connection only after explicit transfer confirmation", async () => {
    const program = Effect.gen(function* () {
      const identity = yield* IdentityService;
      const connections = yield* ConnectionsService;
      const repository = yield* makeConnectionRepository();
      const source = yield* identity.resolve({
        sub: `clerk_${crypto.randomUUID()}`,
      });
      const destination = yield* identity.resolve({
        sub: `clerk_${crypto.randomUUID()}`,
      });
      if (!(source.personalWorkspace && destination.personalWorkspace)) {
        return yield* Effect.die("missing workspaces");
      }
      const connection = yield* repository.insert(
        Connection.insert.make({
          id: makeId(ConnectionId),
          legacyConvexId: null,
          workspaceId: source.personalWorkspace.id,
          platform: "INSTAGRAM",
          profileId: crypto.randomUUID(),
          username: null,
          displayName: null,
          accessToken: "opaque",
          refreshToken: null,
          cipherVersion: "v1",
          expiresAt: null,
          metadata: {},
        })
      );
      yield* connections.confirmTransfer({
        connectionId: connection.id,
        sourceWorkspaceId: source.personalWorkspace.id,
        destinationWorkspaceId: destination.personalWorkspace.id,
      });
      return yield* connections.list(destination.personalWorkspace.id, 10, 0);
    });
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(AppLayer))
    );
    expect(result.total).toBe(1);
  });

  it("moves a connection after the destination user proves provider ownership", async () => {
    const program = Effect.gen(function* () {
      const identity = yield* IdentityService;
      const connections = yield* ConnectionsService;
      const repository = yield* makeConnectionRepository();
      const source = yield* identity.resolve({
        sub: `clerk_${crypto.randomUUID()}`,
      });
      const destination = yield* identity.resolve({
        sub: `clerk_${crypto.randomUUID()}`,
      });
      if (!(source.personalWorkspace && destination.personalWorkspace)) {
        return yield* Effect.die("missing workspaces");
      }
      const profileId = crypto.randomUUID();
      const connection = yield* repository.insert(
        Connection.insert.make({
          id: makeId(ConnectionId),
          legacyConvexId: null,
          workspaceId: source.personalWorkspace.id,
          platform: "INSTAGRAM",
          profileId,
          username: "creator",
          displayName: "Creator",
          accessToken: "old-opaque",
          refreshToken: null,
          cipherVersion: "v1",
          expiresAt: null,
          metadata: {},
        })
      );
      const auth = {
        userId: destination.user.id,
        credential: "session" as const,
        scopes: "full" as const,
      };
      const result = yield* connections.upsertFromOAuth(
        destination.personalWorkspace.id,
        {
          socialType: "INSTAGRAM",
          profileId,
          username: "creator",
          accessToken: "fresh-provider-token",
        },
        `u:${destination.user.id}`
      );
      if (!(result.status === "transfer_required" && result.transferToken)) {
        return yield* Effect.die("missing OAuth transfer grant");
      }
      const unauthorized = yield* connections
        .confirmOAuthTransfer({
          connectionId: connection.id,
          destinationWorkspaceId: destination.personalWorkspace.id,
          auth: {
            userId: source.user.id,
            credential: "session",
            scopes: "full",
          },
          transferToken: result.transferToken,
        })
        .pipe(Effect.result);
      yield* connections.confirmOAuthTransfer({
        connectionId: connection.id,
        destinationWorkspaceId: destination.personalWorkspace.id,
        auth,
        transferToken: result.transferToken,
      });
      const list = yield* connections.list(
        destination.personalWorkspace.id,
        10,
        0
      );
      return { list, unauthorized };
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(AppLayer))
    );
    expect(result.unauthorized._tag).toBe("Failure");
    expect(result.list.total).toBe(1);
  });

  it("re-arms an explicitly rescheduled durable job", async () => {
    const program = Effect.gen(function* () {
      const identity = yield* IdentityService;
      const jobs = yield* JobService;
      const resolved = yield* identity.resolve({
        sub: `clerk_${crypto.randomUUID()}`,
      });
      const workspaceId = resolved.personalWorkspace?.id;
      if (!workspaceId) {
        return yield* Effect.die("missing workspace");
      }
      const key = `rearm-${crypto.randomUUID()}`;
      const id = yield* jobs.enqueue({
        workspaceId,
        payload: { _tag: "SweepPendingMedia" },
        runAt: new Date(Date.now() - 1000),
        idempotencyKey: key,
      });
      yield* jobs.complete(id);
      yield* jobs.enqueue({
        workspaceId,
        payload: { _tag: "SweepPendingMedia" },
        runAt: new Date(Date.now() - 1000),
        idempotencyKey: key,
      });
      const claimed = yield* jobs.claimDue({ limit: 100, leaseSeconds: 60 });
      return { id, claimed };
    });
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(AppLayer))
    );
    expect(result.claimed.filter((job) => job.id === result.id)).toHaveLength(
      1
    );
  });
});
