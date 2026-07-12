import {
  JobId,
  makeId,
  PlatformSettings,
  PostGroupId,
  PostTargetId,
  type TargetStatus,
} from "@delulu/core";
import { Schema } from "effect";
import { epochToDate, epochToDateOr } from "../idmap";
import type {
  LegacyContent,
  LegacyPlatformPost,
  LegacyPost,
  LegacyPostReview,
} from "../legacy";
import { type TransformContext, TransformFatal } from "./context";
import { COUNTER } from "./counters";
import { canonicalKey } from "./fingerprint";
import type { MediaResolver } from "./media";
import { resolveWorkspace } from "./ownership";
import { migratedPostStatus } from "./post-status";
import type { PlatformSettingsValue } from "./settings";
import {
  settingsFor,
  tiktokSettingsFrom,
  UnsupportedPlatformError,
} from "./settings";

const PROCESSING_ERROR =
  "Publishing was interrupted by the platform migration — retry this target";

const decodePlatformSettingsSync = Schema.decodeUnknownSync(PlatformSettings);
const settingsDecode = (candidate: unknown): boolean => {
  try {
    decodePlatformSettingsSync(candidate);
    return true;
  } catch {
    return false;
  }
};

interface Segment {
  readonly text: string;
  readonly media: { readonly id: string; readonly altText?: string }[];
}
interface Group {
  readonly id: string;
  readonly isDefault: boolean;
  readonly segments: readonly Segment[];
}

/** Build segments from a legacy content array, applying the title/tags rules. */
const buildSegments = (
  ctx: TransformContext,
  items: readonly LegacyContent[],
  published: boolean,
  workspaceId: string,
  resolver: MediaResolver
): Segment[] => {
  if (items.length === 0) {
    ctx.counters.bump(COUNTER.postsEmptyContent);
    return [{ text: "", media: [] }];
  }
  const ordered = [...items].sort((a, b) => a.order - b.order);
  return ordered.map((item) => {
    let text = item.text;
    if (item.title !== undefined && item.title !== "") {
      if (published) {
        ctx.counters.bump(COUNTER.postsTitleDropped);
      } else {
        text = `${item.title}\n\n${text}`;
        ctx.counters.bump(COUNTER.postsTitlePrepended);
      }
    }
    if (item.tags !== undefined && item.tags.length > 0) {
      ctx.counters.bump(COUNTER.postsTagsDropped);
    }
    const media = item.media.map((embedded) =>
      resolver.resolve(embedded, workspaceId)
    );
    return { text, media };
  });
};

const platformSettingsValue = (
  ctx: TransformContext,
  post: LegacyPost,
  providerLegacyId: string,
  platform: string
): PlatformSettingsValue | null => {
  // 1. Explicit providerSettings that decode against the new union.
  const entry = post.providerSettings?.find(
    (s) => s.socialProviderId === providerLegacyId
  );
  if (
    entry !== undefined &&
    entry.settings !== null &&
    typeof entry.settings === "object"
  ) {
    const candidate = { platform, values: entry.settings };
    if (settingsDecode(candidate)) {
      return candidate as PlatformSettingsValue;
    }
  }
  // 2. TikTok fallback to deprecated tiktokSettings.
  if (
    platform.toUpperCase() === "TIKTOK" &&
    post.tiktokSettings !== undefined
  ) {
    ctx.counters.bump(COUNTER.targetsSettingsTikTokFallback);
    return tiktokSettingsFrom(post.tiktokSettings);
  }
  // 3. Synthesized defaults — never `{}`.
  try {
    ctx.counters.bump(COUNTER.targetsSettingsSynthesizedDefault);
    return settingsFor(platform, post.privacyStatus);
  } catch (cause) {
    if (cause instanceof UnsupportedPlatformError) {
      return null;
    }
    throw cause;
  }
};

const targetStatusFor = (
  ctx: TransformContext,
  post: LegacyPost,
  platformPost: LegacyPlatformPost | undefined
): {
  status: TargetStatus;
  platformPostId: string | null;
  platformPostUrl: string | null;
  postedAt: Date | null;
  error: string | null;
} => {
  if (
    platformPost?.platformPostId !== undefined &&
    platformPost.platformPostId !== ""
  ) {
    return {
      status: "published",
      platformPostId: platformPost.platformPostId,
      platformPostUrl: platformPost.platformPostUrl ?? null,
      postedAt: epochToDate(platformPost.postedAt),
      error: null,
    };
  }
  if (
    platformPost?.failureReason !== undefined &&
    platformPost.failureReason !== ""
  ) {
    return {
      status: "failed",
      platformPostId: null,
      platformPostUrl: null,
      postedAt: null,
      error: platformPost.failureReason,
    };
  }
  const base = {
    platformPostId: null,
    platformPostUrl: null,
    postedAt: null,
    error: null,
  };
  switch (post.status) {
    case "PUBLISHED":
      ctx.counters.bump(COUNTER.targetsPublishedWithoutPlatformRecord);
      return { ...base, status: "published" };
    case "FAILED":
      return {
        ...base,
        status: "failed",
        error: post.postFailureReason ?? null,
      };
    case "PROCESSING":
      ctx.counters.bump(COUNTER.targetsProcessingInterrupted);
      ctx.warnings.push(
        `posts/${post._id}: PROCESSING target marked failed (interrupted by migration)`
      );
      return { ...base, status: "failed", error: PROCESSING_ERROR };
    default:
      // SAVED, SCHEDULED, DELETED → pending.
      return { ...base, status: "pending" };
  }
};

/** Legacy postReview → new review status overlay (pending/approved/rejected). */
type ReviewOverlay = "pending" | "approved" | "rejected" | undefined;
const overlayStatus = (review: LegacyPostReview | undefined): ReviewOverlay => {
  if (review === undefined) {
    return undefined;
  }
  return review.status === "PENDING"
    ? "pending"
    : review.status === "REJECTED"
      ? "rejected"
      : "approved";
};

export const transformPosts = (
  ctx: TransformContext,
  posts: readonly LegacyPost[],
  resolver: MediaResolver,
  reviewByPost: ReadonlyMap<string, LegacyPostReview>
): void => {
  const seenSubmission = new Set<string>();

  for (const post of posts) {
    // A post whose org was deleted (organizationId set but no workspace) is an
    // orphan of a gone org — drop it rather than hard-failing (user decision).
    if (
      post.organizationId !== undefined &&
      post.organizationId !== "" &&
      !ctx.workspaceByClerkOrg.has(post.organizationId)
    ) {
      ctx.counters.bump(COUNTER.postsDroppedDeletedOrg);
      ctx.warnings.push(
        `posts/${post._id}: organizationId ${post.organizationId} has no workspace (deleted org) — post dropped`
      );
      continue;
    }

    const workspaceId = resolveWorkspace(ctx, {
      organizationId: post.organizationId,
      userId: post.userId,
      entity: "posts",
      legacyId: post._id,
    });
    ctx.postWorkspaceByLegacy.set(post._id, workspaceId);

    const postId = ctx.ids.posts.getOrCreate(post._id);
    const published = post.status === "PUBLISHED";
    const deleted = post.isDeleted || post.status === "DELETED";
    if (deleted) {
      ctx.postDeletedByLegacy.add(post._id);
    }

    const createdByMemberId = ctx.authorMemberFor(workspaceId, post.userId);
    if (createdByMemberId === undefined) {
      throw new TransformFatal(
        `posts/${post._id}: no member could be resolved in workspace ${workspaceId}`
      );
    }
    if (post.userId && ctx.memberFor(workspaceId, post.userId) === undefined) {
      ctx.counters.bump(COUNTER.membersFallbackOwner);
    }

    // --- Content graph ---
    const defaultGroupId = makeId(PostGroupId);
    const defaultSegments = buildSegments(
      ctx,
      post.content,
      published,
      workspaceId,
      resolver
    );
    const groups: Group[] = [
      { id: defaultGroupId, isDefault: true, segments: defaultSegments },
    ];
    const defaultKey = canonicalKey(post.content);

    // provider legacy id → group id the provider's target points at.
    const providerGroup = new Map<string, string>();
    const altKeyToGroup = new Map<string, string>();
    for (const alt of post.alternativeContent ?? []) {
      const key = canonicalKey(alt.content);
      if (key === defaultKey) {
        ctx.counters.bump(COUNTER.altContentCollapsed);
        providerGroup.set(alt.socialProviderId, defaultGroupId);
        continue;
      }
      const existing = altKeyToGroup.get(key);
      if (existing !== undefined) {
        providerGroup.set(alt.socialProviderId, existing);
        continue;
      }
      const groupId = makeId(PostGroupId);
      ctx.counters.bump(COUNTER.altContentDistinct);
      groups.push({
        id: groupId,
        isDefault: false,
        segments: buildSegments(
          ctx,
          alt.content,
          published,
          workspaceId,
          resolver
        ),
      });
      altKeyToGroup.set(key, groupId);
      providerGroup.set(alt.socialProviderId, groupId);
    }
    const content = { groups };
    ctx.postContentByLegacy.set(post._id, content);

    // --- Targets ---
    const platformByProvider = new Map<string, LegacyPlatformPost>();
    for (const pp of post.platformPosts ?? []) {
      platformByProvider.set(pp.socialProviderId, pp);
    }

    const scheduledAt = epochToDate(post.scheduledAt);
    const attempts = post.retryCount ?? 0;
    const targetStatuses: TargetStatus[] = [];
    let hasTarget = false;

    for (const providerLegacyId of post.socialProviderIds) {
      const connectionId = ctx.ids.connections.get(providerLegacyId);
      if (
        connectionId === undefined ||
        ctx.droppedProviders.has(providerLegacyId)
      ) {
        ctx.counters.bump(COUNTER.targetsPrunedUnknownProvider);
        ctx.warnings.push(
          `posts/${post._id}: target for provider ${providerLegacyId} pruned (provider not migrated)`
        );
        continue;
      }
      const platform = ctx.connectionPlatform.get(providerLegacyId) ?? "";
      const settings = platformSettingsValue(
        ctx,
        post,
        providerLegacyId,
        platform
      );
      if (settings === null) {
        ctx.counters.bump(COUNTER.targetsPrunedUnknownProvider);
        ctx.warnings.push(
          `posts/${post._id}: target for provider ${providerLegacyId} pruned (platform ${platform} has no settings schema)`
        );
        continue;
      }

      const targetId = makeId(PostTargetId);
      const platformPost = platformByProvider.get(providerLegacyId);
      const status = targetStatusFor(ctx, post, platformPost);
      targetStatuses.push(status.status);
      hasTarget = true;

      ctx.load.postTargets.push({
        id: targetId,
        legacyConvexId: null,
        postId,
        connectionId,
        groupId: providerGroup.get(providerLegacyId) ?? defaultGroupId,
        settings: JSON.stringify(settings),
        scheduledAt,
        status: status.status,
        platformPostId: status.platformPostId,
        platformPostUrl: status.platformPostUrl,
        postedAt: status.postedAt,
        error: status.error,
        attempts,
        createdAt: epochToDateOr(post._creationTime, post._creationTime),
        updatedAt: epochToDateOr(post.updatedAt, post._creationTime),
      });

      const overlay = overlayStatus(reviewByPost.get(post._id));
      const blockedByReview = overlay === "pending" || overlay === "rejected";
      if (
        status.status === "pending" &&
        scheduledAt !== null &&
        !deleted &&
        !blockedByReview
      ) {
        ctx.counters.bump(COUNTER.jobsEmitted);
        ctx.load.jobs.push({
          id: makeId(JobId),
          legacyConvexId: null,
          workspaceId,
          payload: JSON.stringify({ _tag: "PublishTarget", targetId }),
          runAt: scheduledAt,
          status: "pending",
          attempts: 0,
          maxAttempts: 5,
          lockedUntil: null,
          lastError: null,
          idempotencyKey: `publish-target:${targetId}`,
          createdAt: epochToDateOr(post._creationTime, post._creationTime),
          updatedAt: epochToDateOr(post.updatedAt, post._creationTime),
        });
      }
    }

    // --- Post status ---
    const overlay = overlayStatus(reviewByPost.get(post._id));
    const status = migratedPostStatus({
      targetStatuses,
      anyScheduled: scheduledAt !== null && hasTarget,
      overlay,
    });

    // --- external submission dedupe ---
    let externalSubmissionId = post.externalSubmissionId ?? null;
    if (externalSubmissionId !== null) {
      const key = `${workspaceId}::${externalSubmissionId}`;
      if (seenSubmission.has(key)) {
        ctx.counters.bump(COUNTER.postsDuplicateSubmissionDropped);
        ctx.warnings.push(
          `posts/${post._id}: duplicate externalSubmissionId "${externalSubmissionId}" nulled`
        );
        externalSubmissionId = null;
      } else {
        seenSubmission.add(key);
      }
    }

    ctx.load.posts.push({
      id: postId,
      legacyConvexId: post._id,
      workspaceId,
      status,
      content: JSON.stringify(content),
      createdByMemberId,
      source: "app",
      externalSubmissionId,
      deletedAt: deleted
        ? epochToDateOr(post.updatedAt, post._creationTime)
        : null,
      publishedAt: epochToDate(post.publishedAt),
      createdAt: epochToDateOr(
        post.createdAt ?? post._creationTime,
        post._creationTime
      ),
      updatedAt: epochToDateOr(post.updatedAt, post._creationTime),
    });
  }
};
