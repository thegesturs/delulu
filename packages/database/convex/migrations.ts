import { Migrations } from "@convex-dev/migrations";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { getCurrentTimestamp } from "./utils";

/**
 * Convex migration system.
 *
 * How it works
 * ------------
 * Every migration is a named `migrations.define(...)`. The `@convex-dev/migrations`
 * component records each migration's completion (and cursor) in its own state table,
 * so running `runAll` only executes migrations that have NOT finished yet — already
 * completed ones are skipped instantly, interrupted ones resume from their cursor.
 *
 * Adding a new migration
 * ----------------------
 *   1. Define it below with `migrations.define({ table, migrateOne })`.
 *      Make it idempotent (guard writes, e.g. `if (doc.x === undefined)`).
 *   2. Append its ref to the `runAll` array (APPEND ONLY — never reorder or delete
 *      existing entries; they stay as history but never re-run once complete).
 *   3. Deploy: `pnpm --filter=@delulu/database db:deploy`.
 *
 * Running manually
 * ----------------
 *   Run everything pending:  npx convex run migrations:runAll [--prod]
 *   Run one:                 npx convex run migrations:run '{"fn":"migrations:<name>"}'
 *   Dry run:                 npx convex run migrations:runAll '{"dryRun":true}'
 *   Status:                  npx convex run --component migrations lib:getStatus --watch
 *
 * See packages/database/MIGRATIONS.md for the full workflow.
 */
export const migrations = new Migrations<DataModel>(components.migrations);

/** Generic CLI runner: `npx convex run migrations:run '{"fn":"migrations:<name>"}'`. */
export const run = migrations.runner();

// ---------------------------------------------------------------------------
// Migration definitions — APPEND ONLY. Never reorder or delete existing ones.
// ---------------------------------------------------------------------------

/**
 * Backfill per-user usage counters (social accounts, monthly posts, media bytes)
 * from actual data. Idempotent: recomputes from source every run.
 */
export const backfillUsageCounters = migrations.define({
  table: "users",
  migrateOne: async (ctx, user) => {
    const now = Date.now();
    const monthStart = new Date(
      new Date(now).getFullYear(),
      new Date(now).getMonth(),
      1
    ).getTime();

    // Count active social providers
    const socialProviders = await ctx.db
      .query("socialProviders")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Count non-deleted posts this month
    const postsThisMonth = await ctx.db
      .query("posts")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), monthStart),
          q.eq(q.field("isDeleted"), false)
        )
      )
      .collect();

    // Sum media bytes
    const mediaFiles = await ctx.db
      .query("media")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();

    const totalBytes = mediaFiles.reduce(
      (sum, media) => sum + (media.size ?? 0),
      0
    );

    await ctx.db.patch(user._id, {
      usage: {
        ...user.usage,
        socialAccounts: socialProviders.length,
        monthlyPosts: postsThisMonth.length,
        monthlyPostsPeriodStart: monthStart,
        mediaStorageBytes: totalBytes,
      },
      updatedAt: getCurrentTimestamp(),
    });
  },
});

// ---------------------------------------------------------------------------
// Ordered runner — runs on every deploy via `db:deploy`. APPEND new migrations
// to the end of this array as you add them above.
// ---------------------------------------------------------------------------
export const runAll = migrations.runner([
  internal.migrations.backfillUsageCounters,
]);
