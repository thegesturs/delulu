import { resolveContent } from "./content.js";
import { usageError } from "./runtime.js";

export interface CommonAutomationOptions {
  readonly name?: string;
  readonly post?: readonly string[];
  readonly allPosts?: boolean;
  readonly keyword?: string;
  readonly match?: string;
  readonly caseSensitive?: boolean;
  readonly message?: string;
  readonly commentReply?: readonly string[];
  readonly disabled?: boolean;
  readonly stories?: boolean;
}

const targets = (options: CommonAutomationOptions) => {
  const postIds = [...new Set(options.post ?? [])].filter(Boolean);
  if (options.allPosts && postIds.length > 0) {
    throw usageError("--post and --all-posts are mutually exclusive");
  }
  if (!options.allPosts && postIds.length === 0) {
    throw usageError("Choose at least one --post or use --all-posts");
  }
  return {
    targetMode: options.allPosts ? ("all" as const) : ("specific" as const),
    targetPostIds: options.allPosts
      ? []
      : postIds.filter((id) => !id.startsWith("pending:")),
    pendingPostIds: options.allPosts
      ? undefined
      : postIds
          .filter((id) => id.startsWith("pending:"))
          .map((id) => id.slice("pending:".length)),
  };
};

const keywordFilter = (options: CommonAutomationOptions) => {
  if (!options.keyword) {
    return undefined;
  }
  const operator = options.match ?? "contains";
  if (
    !["contains", "equals", "starts_with", "ends_with", "regex"].includes(
      operator
    )
  ) {
    throw usageError(
      "--match must be contains, equals, starts_with, ends_with, or regex"
    );
  }
  return {
    operator: operator as
      | "contains"
      | "equals"
      | "starts_with"
      | "ends_with"
      | "regex",
    value: options.keyword,
    caseSensitive: Boolean(options.caseSensitive),
  };
};

export const buildCommonAutomation = (
  connectionId: string,
  options: CommonAutomationOptions
) => {
  if (!options.name?.trim()) {
    throw usageError("--name is required");
  }
  if (!options.message?.trim()) {
    throw usageError("--message is required");
  }
  const targeting = targets(options);
  const replies = (options.commentReply ?? [])
    .map((reply) => reply.trim())
    .filter(Boolean);
  return {
    connectionId,
    name: options.name.trim(),
    enabled: !options.disabled,
    triggers: [
      {
        id: "trigger_1",
        type: "trigger" as const,
        triggerType: options.stories
          ? ("story_reply" as const)
          : ("comment" as const),
        ...targeting,
        keywordFilter: keywordFilter(options),
        commentReply:
          replies.length > 0 ? { enabled: true, replies } : undefined,
        nextStepId: "send_dm_1",
      },
    ],
    steps: [
      {
        id: "send_dm_1",
        type: "send_dm" as const,
        messageTemplate: options.message.trim(),
      },
    ],
  };
};

export const readAutomationJson = async (path: string) => {
  const content = await resolveContent({
    file: path === "-" ? undefined : path,
    stdin: path === "-" ? process.stdin : undefined,
    required: true,
  });
  try {
    const parsed: unknown = JSON.parse(content as string);
    if (!(parsed && typeof parsed === "object" && !Array.isArray(parsed))) {
      throw new Error("Expected an object");
    }
    return parsed as Record<string, unknown>;
  } catch (cause) {
    throw usageError(
      `Automation JSON is invalid: ${cause instanceof Error ? cause.message : String(cause)}`
    );
  }
};
