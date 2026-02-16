import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { transcriptionSchema } from "./schemas";
import { getCurrentTimestamp } from "./utils";

const FREE_TRANSCRIPTION_LIMIT = 10;
const PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

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

    return {
      used,
      limit: FREE_TRANSCRIPTION_LIMIT,
      periodEnd: now > periodEnd ? now + PERIOD_MS : periodEnd,
      userId: user._id,
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

    // Check if this reel was already transcribed
    const existing = await ctx.db
      .query("transcriptions")
      .withIndex("by_reel_id", (q) => q.eq("reelId", args.reelId))
      .first();

    if (!existing || existing.userId !== user._id) {
      return null;
    }

    return {
      text: existing.text,
      language: existing.language,
      durationSeconds: existing.durationSeconds,
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
 * Get recent transcriptions for the current user.
 */
export const getUserTranscriptions = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(transcriptionSchema),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    const transcriptions = await ctx.db
      .query("transcriptions")
      .withIndex("by_user_created", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit ?? 50);

    return transcriptions;
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

    return {
      used,
      limit: FREE_TRANSCRIPTION_LIMIT,
    };
  },
});
