import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  type MutationCtx,
  mutation,
} from "./_generated/server";
import {
  DEFAULT_MAX_ATTEMPTS,
  errorClassSchema,
  PUBLISH_JOB_STATUS,
} from "./schemas/publish";
import { replacePostAggregate } from "./stats";
import { getCurrentTimestamp } from "./utils";

// ============================================================================
// PUBLISH PIPELINE v2 — job orchestration (spec: publish-pipeline-v2/08)
//
// Post-level publishStatus is DERIVED from these jobs; a worker never writes it
// directly. This is the fix for the last-writer-wins corruption in
// posts.updatePostPublishStatus.
//
// Rollout is gated by PUBLISH_PIPELINE_V2 (off → shadow → dual → enabled); see
// schemas/publish.ts. The enqueue paths (post.service.ts, posts.publishScheduledPost)
// create runs in shadow+ and thread publishJobId into SQS in dual+.
// ============================================================================

// These mutations are public so the worker (ConvexHttpClient) can call them.
// When PUBLISH_PIPELINE_SECRET is configured, callers must present it — a
// shared-secret stand-in for the ADR-004 HMAC gateway the CF worker can't run.
// Unset (dev/tests/off mode) → open, preserving current behavior.
function assertPipelineAuth(secret: string | undefined): void {
  const expected = process.env.PUBLISH_PIPELINE_SECRET;
  if (expected && secret !== expected) {
    throw new Error("Unauthorized publish pipeline call");
  }
}

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
    secret: v.optional(v.string()),
  },
  returns: v.object({
    runId: v.string(),
    jobs: v.array(
      v.object({
        publishJobId: v.id("publish_jobs"),
        socialProviderId: v.id("socialProviders"),
      })
    ),
  }),
  handler: async (ctx, args) => {
    assertPipelineAuth(args.secret);
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }
    const now = getCurrentTimestamp();
    const runId = crypto.randomUUID();
    const providerIds = args.socialProviderIds ?? post.socialProviderIds;

    const jobs: {
      publishJobId: Id<"publish_jobs">;
      socialProviderId: Id<"socialProviders">;
    }[] = [];
    for (const socialProviderId of providerIds) {
      const publishJobId = await ctx.db.insert("publish_jobs", {
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
      jobs.push({ publishJobId, socialProviderId });
    }

    await ctx.db.patch(args.postId, {
      publishStatus: "QUEUED",
      activeRunId: runId,
      updatedAt: now,
    });

    return { runId, jobs };
  },
});

/**
 * Transition QUEUED → PROCESSING when the worker picks up an SQS message.
 * Idempotent: a redelivery on an already-terminal job is a no-op.
 *
 * Public because the worker calls it via ConvexHttpClient, which can only reach
 * public functions. Idempotency and validation live here, so this is the
 * gateway ADR-004 asks for — without an apps/api hop the CF worker can't make.
 */
export const startAttempt = mutation({
  args: {
    publishJobId: v.id("publish_jobs"),
    attemptNumber: v.number(),
    workerRequestId: v.optional(v.string()),
    secret: v.optional(v.string()),
  },
  returns: v.object({
    alreadyComplete: v.boolean(),
    status: v.string(),
  }),
  handler: async (ctx, args) => {
    assertPipelineAuth(args.secret);
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
 * Idempotent completion gateway. Called by the worker after the provider call.
 * Advances the job state machine and re-derives post status. Public for the
 * same reason as startAttempt.
 */
export const completeAttempt = mutation({
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
    secret: v.optional(v.string()),
  },
  returns: v.object({
    alreadyComplete: v.boolean(),
    jobStatus: v.optional(v.string()),
    postPublishStatus: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    assertPipelineAuth(args.secret);
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

/**
 * Retry failed platforms for a post by starting a fresh run for only the jobs
 * in FAILED or DEAD_LETTER state (optionally filtered to specific providers).
 * Backs the dashboard "Retry" button. Returns the new run's providers so the
 * caller can enqueue exactly those.
 */
export const retryFailedJobs = mutation({
  args: {
    postId: v.id("posts"),
    socialProviderIds: v.optional(v.array(v.id("socialProviders"))),
    // ponytail: shared-secret for now; a dashboard call needs Clerk ownership
    // auth instead — tracked as a pre-enabled follow-up.
    secret: v.optional(v.string()),
  },
  returns: v.object({
    runId: v.optional(v.string()),
    retriedProviderIds: v.array(v.id("socialProviders")),
    jobIds: v.array(v.id("publish_jobs")),
  }),
  handler: async (ctx, args) => {
    assertPipelineAuth(args.secret);
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    const jobs = await ctx.db
      .query("publish_jobs")
      .withIndex("by_post_id", (q) => q.eq("postId", args.postId))
      .collect();

    const requested = args.socialProviderIds
      ? new Set(args.socialProviderIds.map((id) => id.toString()))
      : null;

    // Keep only the LATEST job per provider (by createdAt), then retry those
    // whose latest run failed — so a provider that later succeeded in a newer
    // run is not re-published.
    const latestByProvider = new Map<string, Doc<"publish_jobs">>();
    for (const job of jobs) {
      const key = job.socialProviderId.toString();
      const current = latestByProvider.get(key);
      if (!current || job.createdAt > current.createdAt) {
        latestByProvider.set(key, job);
      }
    }

    const failedByProvider = new Map<string, Id<"socialProviders">>();
    for (const [key, job] of latestByProvider) {
      const isFailed =
        job.status === PUBLISH_JOB_STATUS.FAILED ||
        job.status === PUBLISH_JOB_STATUS.DEAD_LETTER;
      if (!isFailed) {
        continue;
      }
      if (requested && !requested.has(key)) {
        continue;
      }
      failedByProvider.set(key, job.socialProviderId);
    }

    const retriedProviderIds = [...failedByProvider.values()];
    if (retriedProviderIds.length === 0) {
      return { runId: undefined, retriedProviderIds: [], jobIds: [] };
    }

    const now = getCurrentTimestamp();
    const runId = crypto.randomUUID();
    const jobIds: Id<"publish_jobs">[] = [];
    for (const socialProviderId of retriedProviderIds) {
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

    return { runId, retriedProviderIds, jobIds };
  },
});

/**
 * Stuck-job sweeper (Phase 5). Backstop for jobs the SQS DLQ can't catch:
 *   - PROCESSING jobs whose worker died WITHOUT throwing (so SQS never
 *     redelivered and the message silently expired), and
 *   - QUEUED jobs that were never delivered (e.g. enqueue failed mid-loop
 *     after createPublishRun already created the job — see the enqueue paths).
 *
 * SQS is the primary retry mechanism, so the threshold must sit safely BEYOND
 * the max SQS retry window (maxReceiveCount 5 × 15-min visibility ≈ 75 min) or
 * we would dead-letter jobs SQS is still legitimately retrying. Convex can't
 * re-enqueue to the trigger Lambda, so a genuinely stuck job is dead-lettered
 * (surfacing it in the UI) rather than pointlessly re-queued; the user recovers
 * via retryFailedJobs, which creates a fresh run and enqueues it.
 */
export const sweepStuckJobs = internalMutation({
  args: { thresholdMs: v.optional(v.number()) },
  returns: v.object({ deadLettered: v.number() }),
  handler: async (ctx, args) => {
    const threshold = args.thresholdMs ?? 90 * 60 * 1000; // 90 min
    const now = getCurrentTimestamp();
    const cutoff = now - threshold;

    const stuck = [
      ...(await ctx.db
        .query("publish_jobs")
        .withIndex("by_status", (q) => q.eq("status", "PROCESSING"))
        .collect()),
      ...(await ctx.db
        .query("publish_jobs")
        .withIndex("by_status", (q) => q.eq("status", "QUEUED"))
        .collect()),
    ];

    let deadLettered = 0;
    const touchedPosts = new Set<string>();

    for (const job of stuck) {
      if (job.updatedAt >= cutoff) {
        continue; // still within the SQS retry window — leave it alone
      }
      await ctx.db.patch(job._id, {
        status: "DEAD_LETTER",
        errorClass: job.errorClass,
        errorCode: job.errorCode ?? "STUCK_SWEEP",
        errorMessage:
          job.errorMessage ?? "Job stuck past retry window; dead-lettered",
        completedAt: now,
        updatedAt: now,
      });
      deadLettered++;
      touchedPosts.add(job.postId.toString());
    }

    for (const postId of touchedPosts) {
      await deriveAndPatchPostPublishStatus(ctx, postId as Id<"posts">);
    }

    return { deadLettered };
  },
});
