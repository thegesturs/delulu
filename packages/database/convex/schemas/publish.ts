import { v } from "convex/values";

// ============================================================================
// PUBLISH PIPELINE v2 — SINGLE SOURCE OF TRUTH (ADR-009)
// All publish enums and base schemas live here. Worker error codes in
// packages/worker/providers/errors.ts map to errorClass at the API boundary —
// never redefine error-class enums in Convex.
// ============================================================================

// ── Enums ──────────────────────────────────────────────────
export const publishJobStatusSchema = v.union(
  v.literal("QUEUED"),
  v.literal("PROCESSING"),
  v.literal("PUBLISHED"),
  v.literal("FAILED"),
  v.literal("DEAD_LETTER")
);

export const publishAttemptStatusSchema = v.union(
  v.literal("STARTED"),
  v.literal("SUCCEEDED"),
  v.literal("FAILED")
);

// Post-level status derived from child jobs (never written by a worker alone).
export const publishStatusSchema = v.union(
  v.literal("QUEUED"),
  v.literal("PROCESSING"),
  v.literal("PARTIAL"),
  v.literal("PUBLISHED"),
  v.literal("FAILED")
);

export const errorClassSchema = v.union(
  v.literal("TRANSIENT"),
  v.literal("PERMANENT")
);

export const PUBLISH_JOB_STATUS = {
  QUEUED: "QUEUED",
  PROCESSING: "PROCESSING",
  PUBLISHED: "PUBLISHED",
  FAILED: "FAILED",
  DEAD_LETTER: "DEAD_LETTER",
} as const;

export type PublishJobStatus =
  (typeof PUBLISH_JOB_STATUS)[keyof typeof PUBLISH_JOB_STATUS];

export const PUBLISH_STATUS = {
  QUEUED: "QUEUED",
  PROCESSING: "PROCESSING",
  PARTIAL: "PARTIAL",
  PUBLISHED: "PUBLISHED",
  FAILED: "FAILED",
} as const;

export type PublishStatus =
  (typeof PUBLISH_STATUS)[keyof typeof PUBLISH_STATUS];

export const ERROR_CLASS = {
  TRANSIENT: "TRANSIENT",
  PERMANENT: "PERMANENT",
} as const;

export type ErrorClass = (typeof ERROR_CLASS)[keyof typeof ERROR_CLASS];

// Default retry ceiling — matches SQS maxReceiveCount in sst.config.ts.
export const DEFAULT_MAX_ATTEMPTS = 5;

// ── Rollout feature flag (PUBLISH_PIPELINE_V2 env var) ─────
// off      → legacy path only (current behavior)
// shadow   → create jobs for every publish, but the worker still writes via the
//            legacy path (no publishJobId in the SQS message)
// dual     → both paths run; SQS message carries publishJobId
// enabled  → only the new job pipeline writes status
export const PUBLISH_MODES = ["off", "shadow", "dual", "enabled"] as const;
export type PublishMode = (typeof PUBLISH_MODES)[number];

export function parsePublishMode(raw: string | undefined): PublishMode {
  return (PUBLISH_MODES as readonly string[]).includes(raw ?? "")
    ? (raw as PublishMode)
    : "off";
}

/** True when jobs should be created (shadow, dual, enabled). */
export function shouldCreateJobs(mode: PublishMode): boolean {
  return mode !== "off";
}

/** True when the SQS message should carry a publishJobId (dual, enabled). */
export function shouldRouteThroughJobs(mode: PublishMode): boolean {
  return mode === "dual" || mode === "enabled";
}

/** True when the legacy direct-write path should still run (off, shadow, dual). */
export function shouldRunLegacyWrite(mode: PublishMode): boolean {
  return mode !== "enabled";
}

// ── publish_jobs ───────────────────────────────────────────
export const basePublishJobSchema = v.object({
  postId: v.id("posts"),
  socialProviderId: v.id("socialProviders"),
  runId: v.string(), // UUID grouping jobs in one publish run
  status: publishJobStatusSchema,
  attemptCount: v.number(),
  maxAttempts: v.number(),
  nextRetryAt: v.optional(v.number()),
  errorClass: v.optional(errorClassSchema),
  errorCode: v.optional(v.string()), // from worker errors.ts
  errorMessage: v.optional(v.string()),
  platformPostId: v.optional(v.string()),
  platformPostUrl: v.optional(v.string()),
  postedAt: v.optional(v.number()),
  userId: v.optional(v.id("users")),
  organizationId: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  completedAt: v.optional(v.number()),
});

// ── publish_attempts ───────────────────────────────────────
export const basePublishAttemptSchema = v.object({
  publishJobId: v.id("publish_jobs"),
  attemptNumber: v.number(),
  status: publishAttemptStatusSchema,
  errorClass: v.optional(errorClassSchema),
  errorCode: v.optional(v.string()),
  errorMessage: v.optional(v.string()),
  workerRequestId: v.optional(v.string()), // SQS messageId or Lambda requestId
  startedAt: v.number(),
  completedAt: v.optional(v.number()),
});

// ── posts extension ────────────────────────────────────────
export const postPublishFieldsSchema = v.object({
  publishStatus: v.optional(publishStatusSchema), // derived from jobs
  activeRunId: v.optional(v.string()), // current publish run UUID
});
