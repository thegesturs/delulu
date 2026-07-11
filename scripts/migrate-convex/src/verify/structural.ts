import { PlatformSettings, validateContentGraph } from "@delulu/core";
import { Effect, Schema } from "effect";
import type { SqlClient, SqlError } from "effect/unstable/sql";
import type { Manifest } from "../manifest";
import type { Snapshot } from "../snapshot/reader";
import {
  migratedPostStatus,
  type ReviewOverlay,
} from "../transform/post-status";
import { type CheckResult, fail, ok } from "./types";

const decodeSettings = Schema.decodeUnknownSync(
  PlatformSettings as unknown as Schema.Codec<{ platform: string }>
);

const countOf = (sql: SqlClient.SqlClient, table: string) =>
  sql<{ n: number }>`SELECT count(*)::int AS n FROM ${sql(table)}`.pipe(
    Effect.map((rows) => rows[0]?.n ?? 0)
  );

const TABLE_SQL: Record<string, string> = {
  users: "users",
  workspaces: "workspaces",
  workspaceMembers: "workspace_members",
  connections: "connections",
  media: "media",
  posts: "posts",
  postTargets: "post_targets",
  jobs: "jobs",
  subscriptions: "subscriptions",
  transactions: "transactions",
  postReviews: "post_reviews",
  reviewActivity: "review_activity",
  automations: "automations",
  automationRuns: "automation_runs",
  automationContacts: "automation_contacts",
  transcriptions: "transcriptions",
};

/** Check 1 — row-count parity vs snapshot (adjusted by disposition + counters) and manifest. */
export const checkRowCounts = (
  sql: SqlClient.SqlClient,
  snapshot: Snapshot,
  manifest: Manifest
): Effect.Effect<CheckResult, SqlError.SqlError> =>
  Effect.gen(function* () {
    const details: string[] = [];
    const snap = (t: string): number => snapshot.tables.get(t)?.length ?? 0;
    const c = manifest.counters;

    // DB count must equal the loader tally for every table.
    for (const [key, table] of Object.entries(TABLE_SQL)) {
      const db = yield* countOf(sql, table);
      if (db !== manifest.tables[key]) {
        details.push(`${table}: DB ${db} ≠ manifest ${manifest.tables[key]}`);
      }
    }

    // Snapshot-derived identities (spec §4.6).
    const expectations: [string, number, number][] = [
      ["users", manifest.tables.users, snap("users")],
      [
        "workspaces",
        manifest.tables.workspaces,
        snap("organizations") + snap("users"),
      ],
      ["subscriptions", manifest.tables.subscriptions, snap("users")],
      ["posts", manifest.tables.posts, snap("posts")],
      [
        "connections",
        manifest.tables.connections,
        snap("socialProviders") -
          (c["connections.sameOwnerDuplicateDropped"] ?? 0),
      ],
      [
        "media",
        manifest.tables.media,
        snap("media") +
          (c["media.synthesizedUnresolvedRef"] ?? 0) +
          (c["media.synthesizedCrossWorkspaceCopy"] ?? 0),
      ],
      ["jobs", manifest.tables.jobs, c["jobs.publishTargetEmitted"] ?? 0],
    ];
    for (const [table, actual, expected] of expectations) {
      if (actual !== expected) {
        details.push(
          `${table}: transform ${actual} ≠ snapshot-derived ${expected}`
        );
      }
    }

    // Dropped tables must not be loaded.
    for (const table of ["api_keys", "automation_sessions"]) {
      const db = yield* countOf(sql, table);
      if (db !== 0) {
        details.push(`${table}: expected 0 (dropped) but found ${db}`);
      }
    }

    return details.length === 0
      ? ok("Row-count parity", [
          `${Object.keys(TABLE_SQL).length} tables reconciled with snapshot`,
        ])
      : fail("Row-count parity", details);
  });

interface PostRow {
  readonly id: string;
  readonly status: string;
  readonly content: {
    readonly groups: readonly {
      readonly id: string;
      readonly isDefault: boolean;
      readonly segments: readonly {
        readonly media: readonly { readonly id: string }[];
      }[];
    }[];
  };
  readonly deletedAt: string | null;
}
interface TargetRow {
  readonly postId: string;
  readonly groupId: string;
  readonly status: "pending" | "publishing" | "published" | "failed";
  readonly scheduledAt: string | null;
  readonly settings: { readonly platform: string };
  readonly connectionId: string;
  readonly id: string;
}

/** Check 2 — FK integrity + orphan scan (hard FKs are enforced; this covers soft refs). */
export const checkFkIntegrity = (
  sql: SqlClient.SqlClient
): Effect.Effect<CheckResult, SqlError.SqlError> =>
  Effect.gen(function* () {
    const details: string[] = [];
    const orphan = (
      label: string,
      query: Effect.Effect<readonly { readonly n: number }[], SqlError.SqlError>
    ) =>
      Effect.map(query, (rows) => {
        if ((rows[0]?.n ?? 0) > 0) {
          details.push(`${label}: ${rows[0]?.n} orphan(s)`);
        }
      });

    // Representative hard-FK anti-joins.
    yield* orphan(
      "post_targets.connection_id → connections",
      sql<{
        n: number;
      }>`SELECT count(*)::int AS n FROM post_targets t LEFT JOIN connections c ON c.id = t.connection_id WHERE c.id IS NULL`
    );
    yield* orphan(
      "posts.created_by_member_id → workspace_members",
      sql<{
        n: number;
      }>`SELECT count(*)::int AS n FROM posts p LEFT JOIN workspace_members m ON m.id = p.created_by_member_id WHERE m.id IS NULL`
    );
    // Soft ref: every target.group_id exists in its post's content groups.
    yield* orphan(
      "post_targets.group_id → post content groups",
      sql<{
        n: number;
      }>`SELECT count(*)::int AS n FROM post_targets t JOIN posts p ON p.id = t.post_id
        WHERE NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p.content->'groups') g WHERE g->>'id' = t.group_id)`
    );
    // Soft ref: every MediaRef in post content resolves to a media row.
    yield* orphan(
      "post content MediaRef → media",
      sql<{ n: number }>`SELECT count(*)::int AS n FROM (
          SELECT (media_el->>'id') AS media_id
          FROM posts p,
            jsonb_array_elements(p.content->'groups') g,
            jsonb_array_elements(g->'segments') seg,
            jsonb_array_elements(seg->'media') media_el
        ) refs LEFT JOIN media m ON m.id = refs.media_id WHERE m.id IS NULL`
    );
    // Soft ref: every automation pendingPostIds entry resolves to a post.
    yield* orphan(
      "automation pendingPostIds → posts",
      sql<{ n: number }>`SELECT count(*)::int AS n FROM (
          SELECT jsonb_array_elements_text(trig->'pendingPostIds') AS post_id
          FROM automations a, jsonb_array_elements(a.triggers) trig
          WHERE trig ? 'pendingPostIds'
        ) x LEFT JOIN posts p ON p.id = x.post_id WHERE p.id IS NULL`
    );

    return details.length === 0
      ? ok("FK integrity + orphan scan", [
          "no orphans across hard FKs and soft refs",
        ])
      : fail("FK integrity + orphan scan", details);
  });

/** Check 3 — #147 invariants: status rollup, content graph, jobs coverage, settings decode. */
export const checkInvariants = (
  sql: SqlClient.SqlClient
): Effect.Effect<CheckResult, SqlError.SqlError> =>
  Effect.gen(function* () {
    const details: string[] = [];
    const posts =
      yield* sql<PostRow>`SELECT id, status, content, deleted_at AS "deletedAt" FROM posts`;
    const targets =
      yield* sql<TargetRow>`SELECT id, post_id AS "postId", group_id AS "groupId", status, scheduled_at AS "scheduledAt", settings, connection_id AS "connectionId" FROM post_targets`;
    const reviews = yield* sql<{
      postId: string;
      status: "pending" | "approved" | "rejected";
    }>`SELECT post_id AS "postId", status FROM post_reviews`;
    const jobs = yield* sql<{
      idempotencyKey: string;
    }>`SELECT idempotency_key AS "idempotencyKey" FROM jobs`;
    const connections = yield* sql<{
      id: string;
      platform: string;
    }>`SELECT id, platform FROM connections`;

    const targetsByPost = new Map<string, TargetRow[]>();
    for (const t of targets) {
      const list = targetsByPost.get(t.postId) ?? [];
      list.push(t);
      targetsByPost.set(t.postId, list);
    }
    const overlayByPost = new Map<string, ReviewOverlay>();
    for (const r of reviews) {
      overlayByPost.set(r.postId, r.status);
    }
    const jobKeys = new Set(jobs.map((j) => j.idempotencyKey));
    const platformByConnection = new Map(
      connections.map((c) => [c.id, c.platform])
    );

    for (const post of posts) {
      const postTargets = targetsByPost.get(post.id) ?? [];
      const expected = migratedPostStatus({
        targetStatuses: postTargets.map((t) => t.status),
        anyScheduled: postTargets.some((t) => t.scheduledAt !== null),
        overlay: overlayByPost.get(post.id),
      });
      if (expected !== post.status) {
        details.push(
          `posts/${post.id}: stored ${post.status} ≠ computed ${expected}`
        );
      }
      const issues = validateContentGraph(
        post.content,
        postTargets.map((t) => ({ groupId: t.groupId }))
      );
      for (const issue of issues) {
        details.push(
          `posts/${post.id}: content graph ${issue.path}: ${issue.message}`
        );
      }
      for (const t of postTargets) {
        if (
          t.status === "pending" &&
          t.scheduledAt !== null &&
          post.deletedAt === null &&
          !(
            overlayByPost.get(post.id) === "pending" ||
            overlayByPost.get(post.id) === "rejected"
          )
        ) {
          if (!jobKeys.has(`publish-target:${t.id}`)) {
            details.push(
              `post_targets/${t.id}: pending scheduled target has no jobs row`
            );
          }
        }
        try {
          const decoded = decodeSettings(t.settings);
          const connectionPlatform = platformByConnection.get(t.connectionId);
          if (connectionPlatform && decoded.platform !== connectionPlatform) {
            details.push(
              `post_targets/${t.id}: settings platform ${decoded.platform} ≠ connection ${connectionPlatform}`
            );
          }
        } catch (cause) {
          details.push(
            `post_targets/${t.id}: settings do not decode: ${cause instanceof Error ? cause.message : String(cause)}`
          );
        }
      }
    }

    return details.length === 0
      ? ok("#147 invariants", [
          `${posts.length} posts, ${targets.length} targets checked`,
        ])
      : fail("#147 invariants", details.slice(0, 50));
  });
