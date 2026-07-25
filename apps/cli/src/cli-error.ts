export type CliExitCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

const AUTH_MESSAGE =
  /not logged in|token refresh failed|authentication|device login expired|expired_token|revoked token/i;
const ACCESS_MESSAGE =
  /workspace|member|permission|scope|forbidden|access_denied/i;
const NETWORK_MESSAGE = /fetch failed|network|timeout/i;
const WORKSPACE_MESSAGE = /workspace/i;

export class CliError extends Error {
  readonly code: string;
  readonly exitCode: CliExitCode;
  readonly retryable: boolean;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly next?: readonly string[];

  constructor(input: {
    readonly code: string;
    readonly message: string;
    readonly exitCode: CliExitCode;
    readonly retryable?: boolean;
    readonly details?: Readonly<Record<string, unknown>>;
    readonly next?: readonly string[];
  }) {
    super(input.message);
    this.name = "CliError";
    this.code = input.code;
    this.exitCode = input.exitCode;
    this.retryable = input.retryable ?? false;
    this.details = input.details;
    this.next = input.next;
  }
}

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export const classifyError = (error: unknown): CliError => {
  if (error instanceof CliError) {
    return error;
  }
  const tagged = error as {
    readonly _tag?: string;
    readonly code?: string;
    readonly retryable?: boolean;
  };
  const tag = tagged?._tag ?? tagged?.code ?? "UnexpectedError";
  const message = messageOf(error);
  if (tag === "UnauthorizedError" || AUTH_MESSAGE.test(message)) {
    return new CliError({
      code: "AUTH_REQUIRED",
      message,
      exitCode: 3,
      next: ["delulu login"],
    });
  }
  if (tag === "ForbiddenError" || ACCESS_MESSAGE.test(message)) {
    return new CliError({
      code: "ACCESS_DENIED",
      message,
      exitCode: 4,
      next: ["delulu workspace", "delulu login"],
    });
  }
  if (tag === "ValidationError" || tag === "QuotaExceededError") {
    return new CliError({ code: tag, message, exitCode: 5 });
  }
  if (tag === "NotFoundError") {
    return new CliError({
      code: "NOT_FOUND",
      message,
      exitCode: WORKSPACE_MESSAGE.test(message) ? 4 : 5,
    });
  }
  if (tag === "ConflictError") {
    return new CliError({ code: tag, message, exitCode: 6 });
  }
  if (
    tag === "RateLimitedError" ||
    tag === "ProviderUnavailableError" ||
    NETWORK_MESSAGE.test(message)
  ) {
    return new CliError({
      code:
        tag === "RateLimitedError"
          ? "RATE_LIMITED"
          : tag === "ProviderUnavailableError"
            ? "PROVIDER_UNAVAILABLE"
            : "NETWORK_ERROR",
      message,
      exitCode: 7,
      retryable:
        tag === "ProviderUnavailableError" ? (tagged.retryable ?? true) : true,
    });
  }
  return new CliError({ code: tag, message, exitCode: 1 });
};
