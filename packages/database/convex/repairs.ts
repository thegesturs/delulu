import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { postsByUserStatus } from "./stats";

// Step 1: Clear the corrupted aggregate
export const clearPostsAggregate = internalMutation({
  args: {},
  handler: async (ctx) => {
    await postsByUserStatus.clear(ctx);
    console.log("postsByUserStatus aggregate cleared");
  },
});

// Step 2: Backfill aggregate from posts table (batched)
export const backfillPostsAggregate = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    totalProcessed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const BATCH_SIZE = 500;
    let processed = args.totalProcessed ?? 0;

    const results = await ctx.db.query("posts").paginate({
      numItems: BATCH_SIZE,
      cursor: args.cursor ?? null,
    });

    for (const post of results.page) {
      await postsByUserStatus.insertIfDoesNotExist(ctx, post);
      processed++;
    }

    if (results.isDone) {
      console.log(`Backfill complete. Total posts processed: ${processed}`);
    } else {
      await ctx.scheduler.runAfter(0, internal.repairs.backfillPostsAggregate, {
        cursor: results.continueCursor,
        totalProcessed: processed,
      });
      console.log(`Backfilled ${processed} posts so far, continuing...`);
    }
  },
});
