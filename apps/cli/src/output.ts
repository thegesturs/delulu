import { encode } from "@toon-format/toon";
import { CliError } from "./cli-error.js";

export type OutputMode = "pretty" | "toon" | "json";

export interface OutputOptions {
  readonly toon?: boolean;
  readonly json?: boolean;
  readonly pretty?: boolean;
  readonly full?: boolean;
}

export interface CliResult {
  readonly status: "ok";
  readonly message?: string;
  readonly summary?: Readonly<Record<string, unknown>>;
  readonly data?: unknown;
  readonly next?: readonly string[];
}

const color = (code: number, value: string, enabled: boolean) =>
  enabled ? `\u001b[${code}m${value}\u001b[0m` : value;

export const resolveOutputMode = (
  options: OutputOptions,
  isTty = Boolean(process.stdout.isTTY)
): OutputMode => {
  const selected = [options.toon, options.json, options.pretty].filter(Boolean);
  if (selected.length > 1) {
    throw new CliError({
      code: "INVALID_USAGE",
      message: "Choose only one of --toon, --json, or --pretty",
      exitCode: 2,
    });
  }
  if (options.toon) {
    return "toon";
  }
  if (options.json) {
    return "json";
  }
  if (options.pretty) {
    return "pretty";
  }
  const configured = process.env.DELULU_OUTPUT;
  if (
    configured === "toon" ||
    configured === "json" ||
    configured === "pretty"
  ) {
    return configured;
  }
  return isTty ? "pretty" : "toon";
};

export const truncateText = (value: string, limit: number, full = false) => {
  if (full || value.length <= limit) {
    return value;
  }
  return `${value.slice(0, limit)}… [+${value.length - limit} chars]`;
};

const machineEnvelope = (result: CliResult) => ({
  schema: "delulu.cli/v1",
  ...result,
});

const prettyValue = (value: unknown, indent = ""): string[] => {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [`${indent}0 results`];
    }
    return value.flatMap((item) => {
      if (item !== null && typeof item === "object") {
        const entries = Object.entries(item as Record<string, unknown>);
        return [
          `${indent}• ${entries.map(([key, entry]) => `${key}: ${String(entry ?? "—")}`).join("  ")}`,
        ];
      }
      return [`${indent}• ${String(item)}`];
    });
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(
      ([key, entry]) => {
        if (entry !== null && typeof entry === "object") {
          return [`${indent}${key}:`, ...prettyValue(entry, `${indent}  `)];
        }
        return [`${indent}${key}: ${String(entry ?? "—")}`];
      }
    );
  }
  return [`${indent}${String(value ?? "—")}`];
};

const formatPretty = (result: CliResult, isError = false) => {
  const enabled =
    process.env.NO_COLOR === undefined &&
    Boolean((isError ? process.stderr : process.stdout).isTTY);
  const title = result.message ?? (isError ? "Command failed" : "Done");
  const lines = [color(isError ? 31 : 32, title, enabled)];
  lines.push(`status: ${isError ? "error" : result.status}`);
  if (result.summary) {
    lines.push(...prettyValue(result.summary));
  }
  if (result.data !== undefined) {
    lines.push(...prettyValue(result.data));
  }
  if (result.next?.length) {
    lines.push("", color(2, "Next", enabled));
    lines.push(...result.next.map((command) => `  ${command}`));
  }
  return lines.join("\n");
};

export const formatResult = (result: CliResult, mode: OutputMode) => {
  if (mode === "pretty") {
    return formatPretty(result);
  }
  const envelope = machineEnvelope(result);
  return mode === "json" ? JSON.stringify(envelope, null, 2) : encode(envelope);
};

export const formatError = (
  error: CliError,
  mode: OutputMode,
  full = false
) => {
  const result = {
    status: "error" as const,
    error: {
      code: error.code,
      message: truncateText(error.message, 240, full),
      retryable: error.retryable,
      ...(error.details ? { details: error.details } : {}),
    },
    ...(error.next ? { next: error.next } : {}),
  };
  if (mode === "pretty") {
    return formatPretty(
      {
        status: "ok",
        message: result.error.message,
        summary: { code: result.error.code, retryable: result.error.retryable },
        next: result.next,
      },
      true
    );
  }
  const envelope = { schema: "delulu.cli/v1", ...result };
  return mode === "json" ? JSON.stringify(envelope, null, 2) : encode(envelope);
};

export const formatProgress = (
  event: Readonly<Record<string, unknown>>,
  mode: OutputMode
) => {
  if (mode === "pretty") {
    return prettyValue(event).join("\n");
  }
  return encode({ event: event.event ?? "progress", ...event });
};
