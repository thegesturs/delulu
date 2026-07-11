import { TokenCipher } from "@delulu/core";
import { Effect } from "effect";
import type { SqlClient, SqlError } from "effect/unstable/sql";
import type { Manifest } from "../manifest";
import { reconcile } from "../reconcile";
import type { Snapshot } from "../snapshot/reader";
import { decodeAll } from "../transform/decode-all";
import { runTransform } from "../transform/pipeline";
import { type AllowList, type CheckResult, fail, ok } from "./types";

/** Check 4 — sampled deep-equality: re-transform independently and field-compare. */
export const checkSampledEquality = (
  sql: SqlClient.SqlClient,
  snapshot: Snapshot,
  sampleSize: number
): Effect.Effect<CheckResult, SqlError.SqlError> =>
  Effect.gen(function* () {
    const details: string[] = [];
    const result = yield* Effect.promise(() => runTransform(snapshot));

    const compare = <A extends { legacyConvexId: string | null }>(
      table: string,
      transformed: readonly A[],
      dbRows: readonly Record<string, unknown>[],
      fields: readonly (keyof A & string)[]
    ) => {
      const byLegacy = new Map<string, A>();
      for (const row of transformed) {
        if (row.legacyConvexId) {
          byLegacy.set(row.legacyConvexId, row);
        }
      }
      for (const db of dbRows.slice(0, sampleSize)) {
        const legacy = db.legacyConvexId as string | null;
        if (!legacy) {
          continue;
        }
        const expected = byLegacy.get(legacy);
        if (!expected) {
          details.push(
            `${table}/${legacy}: present in DB but not re-transform`
          );
          continue;
        }
        for (const field of fields) {
          const a = String(expected[field]);
          const b = String(db[field]);
          if (a !== b) {
            details.push(
              `${table}/${legacy}.${field}: re-transform ${a} ≠ DB ${b}`
            );
          }
        }
      }
    };

    const users = yield* sql<
      Record<string, unknown>
    >`SELECT legacy_convex_id AS "legacyConvexId", external_id AS "externalId", email, monthly_posts::int AS "monthlyPosts" FROM users ORDER BY created_at`;
    compare("users", result.ctx.load.users, users, [
      "externalId",
      "email",
      "monthlyPosts",
    ]);

    const connections = yield* sql<
      Record<string, unknown>
    >`SELECT legacy_convex_id AS "legacyConvexId", platform, profile_id AS "profileId", access_token AS "accessToken", username FROM connections ORDER BY created_at`;
    compare("connections", result.ctx.load.connections, connections, [
      "platform",
      "profileId",
      "accessToken",
      "username",
    ]);

    const media = yield* sql<
      Record<string, unknown>
    >`SELECT legacy_convex_id AS "legacyConvexId", bucket_key AS "bucketKey", url, media_type AS "mediaType", size_bytes::int AS "sizeBytes" FROM media WHERE legacy_convex_id IS NOT NULL ORDER BY created_at`;
    compare("media", result.ctx.load.media, media, [
      "bucketKey",
      "url",
      "mediaType",
      "sizeBytes",
    ]);

    const transactions = yield* sql<
      Record<string, unknown>
    >`SELECT legacy_convex_id AS "legacyConvexId", provider_transaction_id AS "providerTransactionId", amount_minor::int AS "amountMinor", currency, status FROM transactions ORDER BY created_at`;
    compare("transactions", result.ctx.load.transactions, transactions, [
      "providerTransactionId",
      "amountMinor",
      "currency",
      "status",
    ]);

    return details.length === 0
      ? ok("Sampled deep-equality", [
          `sampled ≤${sampleSize}/table across users, connections, media, transactions`,
        ])
      : fail("Sampled deep-equality", details.slice(0, 40));
  });

/** Check 5 — token spot-check: decrypt sampled ciphertext (≥1 per platform). */
export const checkTokens = (
  sql: SqlClient.SqlClient
): Effect.Effect<CheckResult, SqlError.SqlError, TokenCipher> =>
  Effect.gen(function* () {
    const cipher = yield* TokenCipher;
    const rows = yield* sql<{
      id: string;
      platform: string;
      accessToken: string;
      cipherVersion: "v1";
    }>`
      SELECT DISTINCT ON (platform) id, platform, access_token AS "accessToken", cipher_version AS "cipherVersion"
      FROM connections ORDER BY platform, created_at`;
    if (rows.length === 0) {
      return ok("Token spot-check", ["no connections present"]);
    }
    const details: string[] = [];
    for (const row of rows) {
      const decrypted = yield* cipher
        .decrypt({
          ciphertext: row.accessToken,
          cipherVersion: row.cipherVersion,
        })
        .pipe(Effect.result);
      if (decrypted._tag === "Failure") {
        details.push(
          `connections/${row.id} (${row.platform}): decrypt failed: ${decrypted.failure.message}`
        );
      } else if (decrypted.success.length === 0) {
        details.push(
          `connections/${row.id} (${row.platform}): decrypted to empty string`
        );
      }
    }
    return details.length === 0
      ? ok("Token spot-check", [
          `decrypted ${rows.length} token(s), one per platform`,
        ])
      : fail("Token spot-check", details);
  });

/** Check 6 — quota seed: reconciliation is a no-op; recomputed matches carried (± allow). */
export const checkQuotaSeed = (
  sql: SqlClient.SqlClient,
  manifest: Manifest,
  allow: AllowList
): Effect.Effect<CheckResult, SqlError.SqlError> =>
  Effect.gen(function* () {
    interface Row {
      billingOwnerUserId: string;
      externalId: string;
      monthlyPosts: number;
      mediaStorageBytes: number;
      transcriptionsUsed: number;
      socialAccounts: number;
    }
    const query = sql<Row>`
      SELECT s.billing_owner_user_id AS "billingOwnerUserId", u.external_id AS "externalId",
        s.monthly_posts::int AS "monthlyPosts", s.media_storage_bytes::int AS "mediaStorageBytes",
        s.transcriptions_used::int AS "transcriptionsUsed", s.social_accounts::int AS "socialAccounts"
      FROM subscriptions s JOIN users u ON u.id = s.billing_owner_user_id
      ORDER BY s.billing_owner_user_id`;
    const before = yield* query;
    yield* reconcile(sql);
    const after = yield* query;

    const details: string[] = [];
    const beforeByOwner = new Map(before.map((r) => [r.billingOwnerUserId, r]));
    for (const row of after) {
      const prev = beforeByOwner.get(row.billingOwnerUserId);
      if (
        prev &&
        (prev.monthlyPosts !== row.monthlyPosts ||
          prev.mediaStorageBytes !== row.mediaStorageBytes ||
          prev.transcriptionsUsed !== row.transcriptionsUsed ||
          prev.socialAccounts !== row.socialAccounts)
      ) {
        details.push(
          `subscriptions/${row.externalId}: reconciliation is not idempotent`
        );
      }
    }

    const carried = new Map(
      manifest.subscriptionsCarried.map((c) => [c.billingOwnerUserId, c])
    );
    const allowed = new Set(allow.quotaDiffs ?? []);
    for (const row of after) {
      const c = carried.get(row.billingOwnerUserId);
      if (!c) {
        continue;
      }
      const diffs: string[] = [];
      if (row.monthlyPosts !== c.monthlyPosts) {
        diffs.push(`monthlyPosts ${c.monthlyPosts}→${row.monthlyPosts}`);
      }
      if (row.mediaStorageBytes !== c.mediaStorageBytes) {
        diffs.push(
          `mediaStorageBytes ${c.mediaStorageBytes}→${row.mediaStorageBytes}`
        );
      }
      if (row.transcriptionsUsed !== c.transcriptionsUsed) {
        diffs.push(
          `transcriptionsUsed ${c.transcriptionsUsed}→${row.transcriptionsUsed}`
        );
      }
      if (row.socialAccounts !== c.socialAccounts) {
        diffs.push(`socialAccounts ${c.socialAccounts}→${row.socialAccounts}`);
      }
      if (diffs.length > 0 && !allowed.has(row.externalId)) {
        details.push(
          `subscriptions/${row.externalId}: recomputed ≠ carried [${diffs.join(", ")}] (add to --allow to accept)`
        );
      }
    }

    return details.length === 0
      ? ok("Quota seed", [
          "reconciliation idempotent; recomputed matches carried (or allowed)",
        ])
      : fail("Quota seed", details);
  });

/** Check 7 — ownership audit: org-owned in clerk-org workspace, user-owned in personal workspace. */
export const checkOwnership = (
  sql: SqlClient.SqlClient,
  snapshot: Snapshot
): Effect.Effect<CheckResult, SqlError.SqlError> =>
  Effect.gen(function* () {
    const data = decodeAll(snapshot);
    const workspaceByClerkOrg = new Map<string, string>();
    const personalByUserLegacy = new Map<string, string>();
    const wsRows = yield* sql<{
      id: string;
      clerkOrgId: string | null;
      isPersonal: boolean;
      userLegacy: string | null;
    }>`
      SELECT w.id, w.clerk_org_id AS "clerkOrgId", w.is_personal AS "isPersonal", u.legacy_convex_id AS "userLegacy"
      FROM workspaces w LEFT JOIN users u ON u.id = w.billing_owner_user_id`;
    for (const w of wsRows) {
      if (w.clerkOrgId) {
        workspaceByClerkOrg.set(w.clerkOrgId, w.id);
      }
      if (w.isPersonal && w.userLegacy) {
        personalByUserLegacy.set(w.userLegacy, w.id);
      }
    }

    const details: string[] = [];
    const expectedWorkspace = (owner: {
      organizationId?: string;
      userId?: string;
    }): string | undefined =>
      owner.organizationId
        ? workspaceByClerkOrg.get(owner.organizationId)
        : owner.userId
          ? personalByUserLegacy.get(owner.userId)
          : undefined;

    const audit = <
      A extends { _id: string; organizationId?: string; userId?: string },
    >(
      table: string,
      legacyById: Map<string, A>,
      dbRows: readonly { legacyConvexId: string | null; workspaceId: string }[]
    ) => {
      for (const row of dbRows) {
        if (!row.legacyConvexId) {
          continue;
        }
        const legacy = legacyById.get(row.legacyConvexId);
        if (!legacy) {
          details.push(
            `${table}/${row.legacyConvexId}: no legacy doc for audit`
          );
          continue;
        }
        const expected = expectedWorkspace(legacy);
        if (expected === undefined) {
          details.push(
            `${table}/${row.legacyConvexId}: could not derive expected workspace`
          );
        } else if (expected !== row.workspaceId) {
          details.push(
            `${table}/${row.legacyConvexId}: workspace ${row.workspaceId} ≠ expected ${expected}`
          );
        }
      }
    };

    const mapById = <A extends { _id: string }>(rows: readonly A[]) =>
      new Map(rows.map((r) => [r._id, r]));
    audit(
      "posts",
      mapById(data.posts),
      yield* sql<{
        legacyConvexId: string | null;
        workspaceId: string;
      }>`SELECT legacy_convex_id AS "legacyConvexId", workspace_id AS "workspaceId" FROM posts`
    );
    audit(
      "connections",
      mapById(data.socialProviders),
      yield* sql<{
        legacyConvexId: string | null;
        workspaceId: string;
      }>`SELECT legacy_convex_id AS "legacyConvexId", workspace_id AS "workspaceId" FROM connections`
    );
    audit(
      "media",
      mapById(data.media),
      yield* sql<{
        legacyConvexId: string | null;
        workspaceId: string;
      }>`SELECT legacy_convex_id AS "legacyConvexId", workspace_id AS "workspaceId" FROM media WHERE legacy_convex_id IS NOT NULL`
    );
    audit(
      "automations",
      mapById(data.automations),
      yield* sql<{
        legacyConvexId: string | null;
        workspaceId: string;
      }>`SELECT legacy_convex_id AS "legacyConvexId", workspace_id AS "workspaceId" FROM automations WHERE legacy_convex_id IS NOT NULL`
    );

    return details.length === 0
      ? ok("Ownership audit", [
          "every migrated dual-ownership row lands in its intended workspace",
        ])
      : fail("Ownership audit", details.slice(0, 40));
  });

/** Check 8 — role-mapping audit: mechanical pass + no implicit viewers. */
export const checkRoles = (
  sql: SqlClient.SqlClient,
  snapshot: Snapshot
): Effect.Effect<CheckResult, SqlError.SqlError> =>
  Effect.gen(function* () {
    const data = decodeAll(snapshot);
    const orgByConvexId = new Map(data.organizations.map((o) => [o._id, o]));
    const memberById = new Map(data.organizationMembers.map((m) => [m._id, m]));

    const members = yield* sql<{ legacyConvexId: string | null; role: string }>`
      SELECT legacy_convex_id AS "legacyConvexId", role FROM workspace_members WHERE legacy_convex_id IS NOT NULL`;
    const details: string[] = [];
    for (const row of members) {
      const legacy = memberById.get(row.legacyConvexId as string);
      if (!legacy) {
        details.push(
          `workspace_members/${row.legacyConvexId}: no legacy org member`
        );
        continue;
      }
      const org = orgByConvexId.get(legacy.organizationId);
      const isCreator =
        org !== undefined && legacy.clerkUserId === org.createdBy;
      const expected = isCreator
        ? "owner"
        : legacy.role === "org:admin"
          ? "admin"
          : "editor";
      if (row.role !== expected) {
        details.push(
          `workspace_members/${row.legacyConvexId}: role ${row.role} ≠ expected ${expected}`
        );
      }
    }
    const viewers = yield* sql<{
      n: number;
    }>`SELECT count(*)::int AS n FROM workspace_members WHERE role = 'viewer'`;
    if ((viewers[0]?.n ?? 0) > 0) {
      details.push(
        `${viewers[0]?.n} member(s) mapped to viewer (should never happen)`
      );
    }

    return details.length === 0
      ? ok("Role-mapping audit", [
          `${members.length} org members verified; no implicit viewers`,
        ])
      : fail("Role-mapping audit", details);
  });
