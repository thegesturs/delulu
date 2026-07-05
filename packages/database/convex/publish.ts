import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  type MutationCtx,
  mutation,
} from "./_generated/server";
import { DEFAULT_MAX_ATTEMPTS, errorClassSchema } from "./schemas/publish";
import { replacePostAggregate } from "./stats";
import { getCurrentTimestamp } from "./utils";

// ============================================================================
// PUBLISH PIPELINE v2 — job orchestration (spec: publish-pipeline-v2/08)
//
// Post-level publishStatus is DERIVED from these jobs; a worker never writes it
// directly. This is the fix for the last-writer-wins corruption in
// posts.updatePostPublishStatus.
//
// Phase 1 (current): these mutations exist but are unwired ("shadow mode").
// Nothing enqueues SQS with a publishJobId yet, and the worker still calls the
// legacy path. Wiring happens in Phases 2–3 per the migration doc.
// ============================================================================

/** Extract video bucket keys from a post for post-publish cleanup scheduling. */
function extractVideoBucketKeys(post: Doc<"posts">): string[] {
  const keys: string[] = [];
  const walk = (content: Doc<"posts">["content"]) => {
    for (const item of content) {
      for (const media of item.media) {
        if (media.mediaType === "VIDEO" && media.bucketKey) {
          keys.push(media.bucketKey);
        }
      }
    }
  };
  walk(post.content);
  for (const alt of post.alternativeContent ?? []) {
    walk(alt.content);
  }
  return [...new Set(keys)];
}

/**
 * Pure status aggregation: given the job statuses in a run, compute the
 * derived post publishStatus. Exported for unit testing. Returns undefined for
 * an empty run (nothing to derive).
 *
 * PARTIAL means the run reached a terminal state with a mix of PUBLISHED and
 * FAILED/DEAD_LETTER jobs — the case the old scalar status could not represent.
 */
export function derivePublishStatus(
  statuses: Doc<"publish_jobs">["status"][]
): NonNullable<Doc<"posts">["publishStatus"]> | undefined {
  if (statuses.length === 0) {
    return undefined;
  }
  let published = 0;
  let failed = 0; // FAILED or DEAD_LETTER
  let processing = 0;
  for (const s of statuses) {
    if (s === "PUBLISHED") {
      published++;
    } else if (s === "FAILED" || s === "DEAD_LETTER") {
      failed++;
    } else if (s === "PROCESSING") {
      processing++;
    }
  }
  const terminal = published + failed;
  if (terminal < statuses.length) {
    return processing > 0 ? "PROCESSING" : "QUEUED"; // still in flight
  }
  if (failed === 0) {
    return "PUBLISHED";
  }
  if (published === 0) {
    return "FAILED";
  }
  return "PARTIAL";
}

/** Recompute and persist posts.publishStatus from its active-run jobs. */
async function deriveAndPatchPostPublishStatus(
  ctx: MutationCtx,
  postId: Id<"posts">
): Promise<void> {
  const post = await ctx.db.get(postId);
  if (!post) {
    return;
  }

  const allJobs = await ctx.db
    .query("publish_jobs")
    .withIndex("by_post_id", (q) => q.eq("postId", postId))
    .collect();

  // Only the current run drives the post's publishStatus.
  const jobs = post.activeRunId
    ? allJobs.filter((j) => j.runId === post.activeRunId)
    : allJobs;

  const publishStatus = derivePublishStatus(jobs.map((j) => j.status));
  if (publishStatus === undefined) {
    return;
  }

  if (post.publishStatus !== publishStatus) {
    await ctx.db.patch(postId, {
      publishStatus,
      updatedAt: getCurrentTimestamp(),
    });
  }
}

/**
 * Side effects that must run exactly once when a job reaches PUBLISHED.
 * Mirrors posts.updatePostPublishStatus but scoped to a single provider job.
 */
async function runPublishSideEffects(
  ctx: MutationCtx,
  job: Doc<"publish_jobs">
): Promise<void> {
  const post = await ctx.db.get(job.postId);
  if (!post) {
    return;
  }
  const now = getCurrentTimestamp();

  // Upsert the per-platform record on the parent post.
  const platformPosts = post.platformPosts ?? [];
  const entry = {
    socialProviderId: job.socialProviderId,
    platformPostId: job.platformPostId,
    platformPostUrl: job.platformPostUrl,
    postedAt: job.postedAt ?? now,
    createdAt: now,
    updatedAt: now,
  };
  const idx = platformPosts.findIndex(
    (p) => p.socialProviderId === job.socialProviderId
  );
  if (idx >= 0) {
    platformPosts[idx] = entry;
  } else {
    platformPosts.push(entry);
  }

  const oldPost = { ...post };
  await ctx.db.patch(post._id, { platformPosts, updatedAt: now });
  const newPost = await ctx.db.get(post._id);
  if (newPost) {
    await replacePostAggregate(ctx, oldPost, newPost);
  }

  // Streak.
  if (post.userId) {
    await ctx.runMutation(internal.stats.addPublishDateInternal, {
      userId: post.userId,
      publishDate: now,
    });
  }

  // Link Instagram automations waiting on this media.
  if (job.platformPostId) {
    await ctx.runMutation(internal.automations.linkPublishedPost, {
      convexPostId: job.postId,
      instagramMediaId: job.platformPostId,
      socialProviderId: job.socialProviderId,
    });
  }

  // Schedule video cleanup 7 days out.
  const videoBucketKeys = extractVideoBucketKeys(post);
  if (videoBucketKeys.length > 0) {
    await ctx.scheduler.runAfter(
      0,
      internal.callmelater.scheduleVideoCleanupAction,
      { bucketKeys: videoBucketKeys, postId: job.postId }
    );
  }
}

/**
 * Create a publish run: one QUEUED job per target provider, grouped by runId.
 * Used both for first publish and for retry (with a filtered provider list).
 */
export const createPublishRun = mutation({
  args: {
    postId: v.id("posts"),
    // If omitted, uses all providers on the post.
    socialProviderIds: v.optional(v.array(v.id("socialProviders"))),
  },
  returns: v.object({
    runId: v.string(),
    jobIds: v.array(v.id("publish_jobs")),
  }),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }
    const now = getCurrentTimestamp();
    const runId = crypto.randomUUID();
    const providerIds = args.socialProviderIds ?? post.socialProviderIds;

    const jobIds: Id<"publish_jobs">[] = [];
    for (const socialProviderId of providerIds) {
      const jobId = await ctx.db.insert("publish_jobs", {
        postId: args.postId,
        socialProviderId,
        runId,
        status: "QUEUED",
        attemptCount: 0,
        maxAttempts: DEFAULT_MAX_ATTEMPTS,
        userId: post.userId,
        organizationId: post.organizationId,
        createdAt: now,
        updatedAt: now,
      });
      jobIds.push(jobId);
    }

    await ctx.db.patch(args.postId, {
      publishStatus: "QUEUED",
      activeRunId: runId,
      updatedAt: now,
    });

    return { runId, jobIds };
  },
});

/**
 * Transition QUEUED → PROCESSING when the worker picks up an SQS message.
 * Idempotent: a redelivery on an already-terminal job is a no-op.
 */
export const startAttempt = internalMutation({
  args: {
    publishJobId: v.id("publish_jobs"),
    attemptNumber: v.number(),
    workerRequestId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.publishJobId);
    if (!job) {
      throw new Error("Publish job not found");
    }
    if (
      job.status === "PUBLISHED" ||
      job.status === "FAILED" ||
      job.status === "DEAD_LETTER"
    ) {
      return { alreadyComplete: true as const, status: job.status };
    }

    const now = getCurrentTimestamp();
    await insertAttemptIfNotExists(ctx, {
      publishJobId: args.publishJobId,
      attemptNumber: args.attemptNumber,
      status: "STARTED",
      workerRequestId: args.workerRequestId,
      startedAt: now,
    });
    await ctx.db.patch(job._id, { status: "PROCESSING", updatedAt: now });
    await deriveAndPatchPostPublishStatus(ctx, job.postId);
    return { alreadyComplete: false as const, status: "PROCESSING" as const };
  },
});

/** Append an attempt row unless one already exists for (job, attemptNumber). */
async function insertAttemptIfNotExists(
  ctx: MutationCtx,
  attempt: {
    publishJobId: Id<"publish_jobs">;
    attemptNumber: number;
    status: "STARTED" | "SUCCEEDED" | "FAILED";
    errorClass?: "TRANSIENT" | "PERMANENT";
    errorCode?: string;
    errorMessage?: string;
    workerRequestId?: string;
    startedAt: number;
    completedAt?: number;
  }
): Promise<void> {
  const existing = await ctx.db
    .query("publish_attempts")
    .withIndex("by_job_attempt", (q) =>
      q
        .eq("publishJobId", attempt.publishJobId)
        .eq("attemptNumber", attempt.attemptNumber)
    )
    .unique();
  if (existing) {
    // Update terminal outcome for an already-started attempt.
    if (existing.status === "STARTED" && attempt.status !== "STARTED") {
      await ctx.db.patch(existing._id, {
        status: attempt.status,
        errorClass: attempt.errorClass,
        errorCode: attempt.errorCode,
        errorMessage: attempt.errorMessage,
        completedAt: attempt.completedAt,
      });
    }
    return;
  }
  await ctx.db.insert("publish_attempts", attempt);
}

/**
 * Idempotent completion gateway. Called by the worker (via apps/api) after the
 * provider call. Advances the job state machine and re-derives post status.
 */
export const completeAttempt = internalMutation({
  args: {
    publishJobId: v.id("publish_jobs"),
    attemptNumber: v.number(),
    status: v.union(v.literal("SUCCEEDED"), v.literal("FAILED")),
    platformPostId: v.optional(v.string()),
    platformPostUrl: v.optional(v.string()),
    errorCode: v.optional(v.string()),
    errorClass: v.optional(errorClassSchema),
    errorMessage: v.optional(v.string()),
    workerRequestId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.publishJobId);
    if (!job) {
      throw new Error("Publish job not found");
    }

    // Idempotency: terminal jobs never change.
    if (
      job.status === "PUBLISHED" ||
      job.status === "FAILED" ||
      job.status === "DEAD_LETTER"
    ) {
      return { alreadyComplete: true as const, jobStatus: job.status };
    }

    const now = getCurrentTimestamp();
    await insertAttemptIfNotExists(ctx, {
      publishJobId: args.publishJobId,
      attemptNumber: args.attemptNumber,
      status: args.status,
      errorClass: args.errorClass,
      errorCode: args.errorCode,
      errorMessage: args.errorMessage,
      workerRequestId: args.workerRequestId,
      startedAt: now,
      completedAt: now,
    });

    if (args.status === "SUCCEEDED") {
      await ctx.db.patch(job._id, {
        status: "PUBLISHED",
        platformPostId: args.platformPostId,
        platformPostUrl: args.platformPostUrl,
        postedAt: now,
        completedAt: now,
        updatedAt: now,
      });
      // Re-read so side effects see platformPostId.
      const publishedJob = await ctx.db.get(job._id);
      if (publishedJob) {
        await runPublishSideEffects(ctx, publishedJob);
      }
    } else if (args.errorClass === "PERMANENT") {
      await ctx.db.patch(job._id, {
        status: "FAILED",
        errorClass: "PERMANENT",
        errorCode: args.errorCode,
        errorMessage: args.errorMessage,
        completedAt: now,
        updatedAt: now,
      });
    } else {
      // TRANSIENT — count the attempt; dead-letter once the ceiling is hit,
      // otherwise stay PROCESSING and let SQS redeliver.
      const newCount = job.attemptCount + 1;
      if (newCount >= job.maxAttempts) {
        await ctx.db.patch(job._id, {
          status: "DEAD_LETTER",
          attemptCount: newCount,
          errorClass: "TRANSIENT",
          errorCode: args.errorCode,
          errorMessage: args.errorMessage,
          completedAt: now,
          updatedAt: now,
        });
      } else {
        await ctx.db.patch(job._id, {
          attemptCount: newCount,
          errorClass: "TRANSIENT",
          errorCode: args.errorCode,
          errorMessage: args.errorMessage,
          updatedAt: now,
        });
      }
    }

    await deriveAndPatchPostPublishStatus(ctx, job.postId);

    const finalJob = await ctx.db.get(job._id);
    const finalPost = await ctx.db.get(job.postId);
    return {
      alreadyComplete: false as const,
      jobStatus: finalJob?.status,
      postPublishStatus: finalPost?.publishStatus,
    };
  },
});
