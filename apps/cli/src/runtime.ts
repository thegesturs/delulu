import type { ApiClient } from "@delulu/client";
import { getContractClient, getWorkspaceId } from "./api.js";
import { CliError, classifyError } from "./cli-error.js";
import {
  type CliResult,
  formatError,
  formatProgress,
  formatResult,
  type OutputOptions,
  resolveOutputMode,
} from "./output.js";

export interface GlobalOptions extends OutputOptions {
  readonly apiUrl?: string;
  readonly workspace?: string;
}

export interface CommandContext {
  readonly options: GlobalOptions;
  readonly client: ApiClient;
  readonly workspaceId: () => Promise<string>;
  readonly progress: (event: Readonly<Record<string, unknown>>) => void;
}

export const createCommandContext = (
  options: GlobalOptions
): CommandContext => {
  const mode = resolveOutputMode(options);
  const client = getContractClient(options);
  return {
    options,
    client,
    workspaceId: () => getWorkspaceId(options),
    progress: (event) =>
      process.stderr.write(`${formatProgress(event, mode)}\n`),
  };
};

export const executeCommand = async (
  options: GlobalOptions,
  handler: (context: CommandContext) => Promise<CliResult>
) => {
  const mode = resolveOutputMode(options);
  try {
    const result = await handler(createCommandContext(options));
    process.stdout.write(`${formatResult(result, mode)}\n`);
    return 0;
  } catch (cause) {
    const error = classifyError(cause);
    process.stderr.write(`${formatError(error, mode, options.full)}\n`);
    process.exitCode = error.exitCode;
    return error.exitCode;
  }
};

export const usageError = (message: string, next?: readonly string[]) =>
  new CliError({
    code: "INVALID_USAGE",
    message,
    exitCode: 2,
    next,
  });
