import { Daytona } from "@daytona/sdk";
import { ProviderUnavailableError } from "@delulu/contracts";
import type { AgentNetworkPolicy } from "@delulu/core";
import { Context, Effect, Layer } from "effect";
import {
  boundCommandOutput,
  ExecutionWorkspaceProvider,
  type ProvisionWorkspaceInput,
} from "./execution-workspace";

export class ExecutionWorkspaceConfig extends Context.Service<
  ExecutionWorkspaceConfig,
  {
    readonly apiKey: string;
    readonly apiUrl?: string;
    readonly target?: string;
    readonly snapshot?: string;
    readonly autoPauseMinutes: number;
  }
>()("@delulu/services/ExecutionWorkspaceConfig") {}

const packageDomains = [
  "registry.npmjs.org",
  "github.com",
  "api.github.com",
  "objects.githubusercontent.com",
];
const HOSTNAME =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

const safeDomains = (domains: readonly string[]): readonly string[] =>
  domains
    .map((domain) => domain.toLowerCase())
    .filter((domain) => HOSTNAME.test(domain));

export const networkSettings = (
  policy: AgentNetworkPolicy,
  approvedDomains: readonly string[] = []
): {
  readonly networkBlockAll?: boolean;
  readonly domainAllowList?: string;
} => {
  if (policy === "none") {
    return { networkBlockAll: true };
  }
  if (policy === "packages") {
    return { domainAllowList: packageDomains.join(",") };
  }
  if (policy === "approved_domains") {
    const domains = safeDomains(approvedDomains);
    return domains.length === approvedDomains.length && domains.length > 0
      ? { domainAllowList: domains.join(",") }
      : { networkBlockAll: true };
  }
  return {};
};

const providerError = (_cause: unknown, operation: string) =>
  new ProviderUnavailableError({
    message: `Execution workspace ${operation} failed`,
    provider: "execution-workspace",
    retryable: true,
  });

export const DaytonaExecutionWorkspace = Layer.effect(
  ExecutionWorkspaceProvider,
  Effect.gen(function* () {
    const config = yield* ExecutionWorkspaceConfig;
    if (!config.apiKey) {
      const unavailable = (operation: string) =>
        Effect.fail(
          new ProviderUnavailableError({
            message: `Execution workspace ${operation} is not configured`,
            provider: "execution-workspace",
            retryable: false,
          })
        );
      return ExecutionWorkspaceProvider.of({
        provision: () => unavailable("provisioning"),
        resume: () => unavailable("resume"),
        pause: () => unavailable("pause"),
        destroy: () => unavailable("deletion"),
        execute: () => unavailable("command execution"),
        snapshot: () => unavailable("snapshotting"),
      });
    }
    const client = new Daytona({
      apiKey: config.apiKey,
      apiUrl: config.apiUrl,
      target: config.target,
      otelEnabled: false,
    });
    const load = (id: string) => client.get(id);
    const provision = (input: ProvisionWorkspaceInput) =>
      Effect.tryPromise({
        try: async () => {
          for await (const existing of client.list({
            labels: { computer_id: input.computerId },
          })) {
            if (existing.labels.computer_id === input.computerId) {
              return {
                id: existing.id,
                state:
                  existing.state === "started"
                    ? ("running" as const)
                    : ("paused" as const),
              };
            }
          }
          const sandbox = await client.create({
            language: "typescript",
            ...(config.snapshot ? { snapshot: config.snapshot } : {}),
            name: `agent-${input.computerId}`,
            labels: {
              computer_id: input.computerId,
              workspace_id: input.workspaceId,
              user_id: input.userId,
            },
            public: false,
            autoPauseInterval: config.autoPauseMinutes,
            autoDeleteInterval: -1,
            ...networkSettings(input.networkPolicy, input.approvedDomains),
          });
          return { id: sandbox.id, state: "running" as const };
        },
        catch: (cause) => providerError(cause, "provisioning"),
      });
    return ExecutionWorkspaceProvider.of({
      provision,
      resume: (id) =>
        Effect.tryPromise({
          try: async () => {
            const sandbox = await load(id);
            if (sandbox.state !== "started") {
              await sandbox.start();
            }
          },
          catch: (cause) => providerError(cause, "resume"),
        }),
      pause: (id) =>
        Effect.tryPromise({
          try: async () => {
            await (await load(id)).pause();
          },
          catch: (cause) => providerError(cause, "pause"),
        }),
      destroy: (id) =>
        Effect.tryPromise({
          try: async () => {
            await (await load(id)).delete();
          },
          catch: (cause) => providerError(cause, "deletion"),
        }),
      execute: (input) =>
        Effect.tryPromise({
          try: async () => {
            const result = await (
              await load(input.workspaceId)
            ).process.executeCommand(
              input.command,
              input.workingDirectory,
              input.environment ? { ...input.environment } : undefined,
              input.timeoutSeconds
            );
            const bounded = boundCommandOutput(result.result);
            return {
              exitCode: result.exitCode,
              output: bounded.output,
              outputTruncated: bounded.truncated,
            };
          },
          catch: (cause) => providerError(cause, "command execution"),
        }),
      snapshot: (id, name) =>
        Effect.tryPromise({
          try: async () => {
            await (await load(id)).createSnapshot(name);
            return name;
          },
          catch: (cause) => providerError(cause, "snapshotting"),
        }),
    });
  })
);
