import { SORTED_LIMITS } from "@delulu/payments/product-ids";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { transcriptionSchema } from "./schemas";
import { getCurrentTimestamp } from "./utils";

const {
  FREE_TRANSCRIPTION_LIMIT,
  PAID_TRANSCRIPTION_SOFT_LIMIT,
  PAID_TRANSCRIPTION_HARD_LIMIT,
  PERIOD_MS,
} = SORTED_LIMITS;

async function isSortedAddonActive(
  ctx: QueryCtx,
  user: Doc<"users">
): Promise<boolean> {
  for (const subId of user.addonSubscriptionIds ?? []) {
    const sub = await ctx.db.get(subId);
    if (sub?.addonType === "sorted" && sub.status === "ACTIVE") {
      return true;
    }
  }
  return false;
}

// ============================================================================
// WEBHOOK QUERIES (called by Lambda, require webhookSecret)
// ============================================================================

/**
 * Get transcription usage for a user by their Clerk external ID.
 * Called by the transcription Lambda to check quota before processing.
 */
export const getUserTranscriptionUsage = query({
  args: {
    webhookSecret: v.string(),
    externalId: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.webhookSecret !== process.env.POSTING_SECRET_KEY) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const now = getCurrentTimestamp();
    const periodStart = user.usage.transcriptionPeriodStart ?? now;
    const periodEnd = periodStart + PERIOD_MS;

    // If period has expired, usage resets to 0
    const used = now > periodEnd ? 0 : (user.usage.transcriptionsUsed ?? 0);

    const isSortedActive = await isSortedAddonActive(ctx, user);

    return {
      used,
      limit: FREE_TRANSCRIPTION_LIMIT,
      periodEnd: now > periodEnd ? now + PERIOD_MS : periodEnd,
      userId: user._id,
      isSortedActive,
      dodoCustomerId: user.dodoCustomerId ?? null,
    };
  },
});

/**
 * Get an existing transcription for a reel (cache check).
 * Called by Lambda before invoking Whisper to avoid duplicate work.
 */
export const getTranscriptionByReelId = query({
  args: {
    webhookSecret: v.string(),
    reelId: v.string(),
    externalId: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.webhookSecret !== process.env.POSTING_SECRET_KEY) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .unique();

    if (!user) {
      return null;
    }

    // Check if this reel was already transcribed (shared cache across users)
    const existing = await ctx.db
      .query("transcriptions")
      .withIndex("by_reel_id", (q) => q.eq("reelId", args.reelId))
      .first();

    if (!existing) {
      return null;
    }

    return {
      text: existing.text,
      altText: existing.altText,
      language: existing.language,
      durationSeconds: existing.durationSeconds,
      isOwnCache: existing.userId === user._id,
    };
  },
});

// ============================================================================
// WEBHOOK MUTATIONS (called by Lambda, require webhookSecret)
// ============================================================================

/**
 * Store a new transcription result.
 */
export const createTranscription = mutation({
  args: {
    webhookSecret: v.string(),
    externalId: v.string(),
    reelId: v.string(),
    reelUrl: v.string(),
    text: v.string(),
    altText: v.optional(v.string()),
    language: v.string(),
    durationSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.webhookSecret !== process.env.POSTING_SECRET_KEY) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.insert("transcriptions", {
      userId: user._id,
      reelId: args.reelId,
      reelUrl: args.reelUrl,
      text: args.text,
      ...(args.altText ? { altText: args.altText } : {}),
      language: args.language,
      durationSeconds: args.durationSeconds,
      createdAt: getCurrentTimestamp(),
    });
  },
});

/**
 * Increment transcription usage for a user.
 * Resets the counter if the billing period has expired.
 */
export const incrementTranscriptionUsage = mutation({
  args: {
    webhookSecret: v.string(),
    externalId: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.webhookSecret !== process.env.POSTING_SECRET_KEY) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const now = getCurrentTimestamp();
    const periodStart = user.usage.transcriptionPeriodStart ?? now;
    const periodEnd = periodStart + PERIOD_MS;
    const periodExpired = now > periodEnd;

    await ctx.db.patch(user._id, {
      usage: {
        ...user.usage,
        transcriptionsUsed: periodExpired
          ? 1
          : (user.usage.transcriptionsUsed ?? 0) + 1,
        transcriptionPeriodStart: periodExpired ? now : periodStart,
      },
      updatedAt: now,
    });
  },
});

// ============================================================================
// USER-FACING QUERIES (for popup usage display)
// ============================================================================

/**
 * Get transcriptions with pagination and optional search.
 * Called via ConvexHttpClient with manual cursor tracking.
 */
export const getUserTranscriptions = query({
  args: {
    paginationOpts: paginationOptsValidator,
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", identity.subject))
      .unique();

    if (!user) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    if (args.searchTerm) {
      return await ctx.db
        .query("transcriptions")
        .withSearchIndex("search_text", (q) =>
          q.search("text", args.searchTerm!).eq("userId", user._id)
        )
        .paginate(args.paginationOpts);
    }

    return await ctx.db
      .query("transcriptions")
      .withIndex("by_user_created", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

/**
 * Get transcription usage for the current authenticated user.
 * Used by the extension popup to display the usage meter.
 */
export const getMyTranscriptionUsage = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", identity.subject))
      .unique();

    if (!user) {
      return null;
    }

    const now = getCurrentTimestamp();
    const periodStart = user.usage.transcriptionPeriodStart ?? now;
    const periodEnd = periodStart + PERIOD_MS;
    const used = now > periodEnd ? 0 : (user.usage.transcriptionsUsed ?? 0);

    const isSortedActive = await isSortedAddonActive(ctx, user);

    return {
      used,
      limit: FREE_TRANSCRIPTION_LIMIT,
      isSubscribed: isSortedActive,
      paidSoftLimit: PAID_TRANSCRIPTION_SOFT_LIMIT,
      paidHardLimit: PAID_TRANSCRIPTION_HARD_LIMIT,
    };
  },
});
