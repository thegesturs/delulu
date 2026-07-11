import type { PostStatus } from "./post";
import type { ReviewStatus } from "./post-review";
import type { TargetStatus } from "./post-target";

export interface ContentGraphIssue {
  readonly path: string;
  readonly message: string;
}

interface TargetGroupReference {
  readonly groupId: string;
}

interface ContentGraphInput {
  readonly groups: readonly {
    readonly id: string;
    readonly isDefault: boolean;
    readonly segments: readonly unknown[];
  }[];
}

/** Validate invariants that span the JSONB content graph and target rows. */
export const validateContentGraph = (
  content: ContentGraphInput,
  targets: readonly TargetGroupReference[]
): readonly ContentGraphIssue[] => {
  const issues: ContentGraphIssue[] = [];
  if (content.groups.length === 0) {
    issues.push({
      path: "content.groups",
      message: "At least one content group is required",
    });
  }
  if (content.groups.filter((group) => group.isDefault).length !== 1) {
    issues.push({
      path: "content.groups",
      message: "Exactly one group must be default",
    });
  }
  const groupIds = new Set<string>();
  content.groups.forEach((group, index) => {
    if (groupIds.has(group.id)) {
      issues.push({
        path: `content.groups[${index}].id`,
        message: "Content group ids must be unique",
      });
    }
    groupIds.add(group.id);
    if (group.segments.length === 0) {
      issues.push({
        path: `content.groups[${index}].segments`,
        message: "Each group must contain at least one segment",
      });
    }
  });
  targets.forEach((target, index) => {
    if (!groupIds.has(target.groupId)) {
      issues.push({
        path: `targets[${index}].groupId`,
        message: "Target references a group that does not exist",
      });
    }
  });
  return issues;
};

/** Single source of truth for the stored post status. */
export const rollupPostStatus = (
  statuses: readonly TargetStatus[],
  reviewStatus?: ReviewStatus
): PostStatus => {
  if (reviewStatus === "pending") {
    return "pending_review";
  }
  if (reviewStatus === "rejected") {
    return "changes_requested";
  }
  if (statuses.some((status) => status === "publishing")) {
    return "publishing";
  }
  if (
    statuses.length > 0 &&
    statuses.every((status) => status === "published")
  ) {
    return "published";
  }
  const published = statuses.some((status) => status === "published");
  const failed = statuses.some((status) => status === "failed");
  if (published && failed) {
    return "partially_failed";
  }
  if (statuses.length > 0 && statuses.every((status) => status === "failed")) {
    return "failed";
  }
  return "scheduled";
};

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)])
    );
  }
  return value;
};

/** SHA-256 fingerprint of the canonical content graph used by approvals. */
export const contentFingerprint = async (content: unknown): Promise<string> => {
  const encoded = new TextEncoder().encode(
    JSON.stringify(canonicalize(content))
  );
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
};
