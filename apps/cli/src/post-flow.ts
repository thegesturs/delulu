import { CliError } from "./cli-error.js";

export type PostIntent = "draft" | "schedule" | "publish_now";

export interface PostAccount {
  readonly id: string;
  readonly platform: string;
  readonly username?: string | null;
  readonly displayName?: string | null;
  readonly settings?: unknown;
}

export interface PostFlowResult {
  readonly id: string;
  readonly status: string;
  readonly targets: readonly {
    readonly id: string;
    readonly status: string;
    readonly platformPostUrl?: string | null;
    readonly error?: string | null;
  }[];
}

export interface PostFlowAdapter {
  readonly listAccounts: () => Promise<readonly PostAccount[]>;
  readonly addMedia: (source: string, altText?: string) => Promise<string>;
  readonly create: (input: {
    readonly caption: string;
    readonly accounts: readonly PostAccount[];
    readonly mediaIds: readonly string[];
    readonly intent: PostIntent;
    readonly idempotencyKey?: string;
    readonly scheduledAt: string | null;
    readonly privacy?: string;
  }) => Promise<PostFlowResult>;
  readonly get: (id: string) => Promise<PostFlowResult>;
  readonly sleep: (milliseconds: number) => Promise<void>;
  readonly now: () => number;
}

export interface SubmitPostInput {
  readonly caption: string;
  readonly accountSelectors?: readonly string[];
  readonly mediaSources?: readonly string[];
  readonly altText?: string;
  readonly intent: PostIntent;
  readonly idempotencyKey?: string;
  readonly scheduledAt?: string;
  readonly privacy?: string;
  readonly waitForTerminal?: boolean;
  readonly timeoutMs?: number;
  readonly pollIntervalMs?: number;
}

export const splitValues = (values: readonly string[] = []) =>
  values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

const accountLabel = (account: PostAccount) =>
  `${account.platform.toLowerCase()}${account.username ? `@${account.username}` : `:${account.id}`}`;

export const resolveAccounts = (
  accounts: readonly PostAccount[],
  selectors: readonly string[]
) => {
  const values = splitValues(selectors);
  if (values.length === 0) {
    throw new CliError({
      code: "ACCOUNT_REQUIRED",
      message: `Choose an account with --to. Available: ${accounts.map(accountLabel).join(", ") || "none"}`,
      exitCode: 2,
      next: ["delulu accounts"],
    });
  }

  const selected = values.map((selector) => {
    const normalized = selector.toLowerCase();
    const matches = accounts.filter((account) => {
      const platform = account.platform.toLowerCase();
      const username = account.username?.toLowerCase();
      return (
        account.id === selector ||
        platform === normalized ||
        username === normalized ||
        (username !== undefined && `${platform}@${username}` === normalized)
      );
    });
    if (matches.length === 0) {
      throw new CliError({
        code: "ACCOUNT_NOT_FOUND",
        message: `Account ${selector} was not found. Available: ${accounts.map(accountLabel).join(", ") || "none"}`,
        exitCode: 2,
        next: ["delulu accounts"],
      });
    }
    if (matches.length > 1) {
      throw new CliError({
        code: "ACCOUNT_AMBIGUOUS",
        message: `Account ${selector} is ambiguous. Use one of: ${matches.map(accountLabel).join(", ")}`,
        exitCode: 2,
        next: ["delulu accounts"],
      });
    }
    return matches[0] as PostAccount;
  });
  return [
    ...new Map(selected.map((account) => [account.id, account])).values(),
  ];
};

const terminalPublishStatuses = new Set([
  "published",
  "partially_failed",
  "failed",
]);

export const waitForPostTerminal = async <Result extends PostFlowResult>(
  initial: Result,
  input: {
    readonly get: (id: string) => Promise<Result>;
    readonly sleep: (milliseconds: number) => Promise<void>;
    readonly now: () => number;
    readonly timeoutMs?: number;
    readonly pollIntervalMs?: number;
  }
) => {
  let result = initial;
  const deadline = input.now() + (input.timeoutMs ?? 6 * 60_000);
  while (
    !terminalPublishStatuses.has(result.status) &&
    input.now() < deadline
  ) {
    await input.sleep(input.pollIntervalMs ?? 2000);
    result = await input.get(result.id);
  }
  if (!terminalPublishStatuses.has(result.status)) {
    throw new CliError({
      code: "PUBLISH_TIMEOUT",
      message: "Publishing was accepted but did not finish before the timeout",
      exitCode: 9,
      retryable: true,
      details: { postId: result.id, state: result.status },
      next: [`delulu show ${result.id}`],
    });
  }
  if (result.status === "failed" || result.status === "partially_failed") {
    throw new CliError({
      code: "PUBLISH_PARTIAL_FAILURE",
      message: "One or more publishing targets failed",
      exitCode: 8,
      retryable: true,
      details: { postId: result.id, state: result.status },
      next: [`delulu show ${result.id}`, `delulu retry ${result.id}`],
    });
  }
  return result;
};

export const submitPost = async (
  input: SubmitPostInput,
  adapter: PostFlowAdapter
): Promise<PostFlowResult> => {
  if (!input.caption.trim()) {
    throw new CliError({
      code: "CONTENT_REQUIRED",
      message: "Caption cannot be empty",
      exitCode: 2,
    });
  }
  const scheduleMilliseconds = input.scheduledAt
    ? Date.parse(input.scheduledAt)
    : undefined;
  if (
    scheduleMilliseconds !== undefined &&
    !Number.isFinite(scheduleMilliseconds)
  ) {
    throw new CliError({
      code: "INVALID_SCHEDULE",
      message: "--at must be a valid ISO 8601 timestamp",
      exitCode: 2,
    });
  }
  const scheduledAt =
    scheduleMilliseconds === undefined
      ? null
      : new Date(scheduleMilliseconds).toISOString();
  if (input.intent === "schedule" && scheduledAt === null) {
    throw new Error("Scheduled posts require --at with an ISO 8601 timestamp");
  }
  if (input.intent !== "schedule" && scheduledAt !== null) {
    throw new Error("--at cannot be combined with draft or publish-now intent");
  }

  const accounts = resolveAccounts(
    await adapter.listAccounts(),
    input.accountSelectors ?? []
  );
  const mediaIds = await Promise.all(
    splitValues(input.mediaSources).map((source) =>
      adapter.addMedia(source, input.altText)
    )
  );
  const result = await adapter.create({
    caption: input.caption,
    accounts,
    mediaIds,
    intent: input.intent,
    idempotencyKey: input.idempotencyKey,
    scheduledAt,
    privacy: input.privacy,
  });

  if (input.intent !== "publish_now" || input.waitForTerminal === false) {
    return result;
  }
  if (result.status === "draft") {
    throw new CliError({
      code: "ATOMIC_PUBLISH_REJECTED",
      message:
        "The server did not accept atomic publishing. The post remains a draft and was not retried.",
      exitCode: 6,
    });
  }

  return waitForPostTerminal(result, {
    get: adapter.get,
    sleep: adapter.sleep,
    now: adapter.now,
    timeoutMs: input.timeoutMs,
    pollIntervalMs: input.pollIntervalMs,
  });
};
