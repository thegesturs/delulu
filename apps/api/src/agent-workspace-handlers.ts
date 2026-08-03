import { Api, ConflictError } from "@delulu/contracts";
import { CurrentAuth } from "@delulu/core";
import {
  AgentComputerService,
  WorkspaceAccessService,
  WorkspaceFileService,
} from "@delulu/services";
import { Effect, Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { AuthenticationLive } from "./auth-middleware";

export const AgentComputerHandlers = HttpApiBuilder.group(
  Api,
  "agentComputer",
  Effect.fnUntraced(function* (handlers) {
    const computers = yield* AgentComputerService;
    const workspaces = yield* WorkspaceAccessService;
    const access = (
      workspaceId: string,
      scope: "computer:read" | "computer:write"
    ) =>
      Effect.gen(function* () {
        const auth = yield* CurrentAuth;
        return {
          auth,
          workspace: yield* workspaces.require({ workspaceId, auth, scope }),
        };
      });
    return handlers
      .handle("get", ({ params }) =>
        Effect.gen(function* () {
          const context = yield* access(params.workspaceId, "computer:read");
          return yield* computers.get(
            context.workspace.workspaceId,
            context.auth.userId
          );
        })
      )
      .handle("enable", ({ params, payload }) =>
        Effect.gen(function* () {
          const context = yield* access(params.workspaceId, "computer:write");
          return yield* computers.enable({
            workspaceId: context.workspace.workspaceId,
            userId: context.auth.userId,
            networkPolicy: payload.networkPolicy ?? "packages",
            approvedDomains: payload.approvedDomains,
          });
        })
      )
      .handle("resume", ({ params }) =>
        Effect.gen(function* () {
          const context = yield* access(params.workspaceId, "computer:write");
          return yield* computers.resume(
            context.workspace.workspaceId,
            context.auth.userId
          );
        })
      )
      .handle("pause", ({ params }) =>
        Effect.gen(function* () {
          const context = yield* access(params.workspaceId, "computer:write");
          return yield* computers.pause(
            context.workspace.workspaceId,
            context.auth.userId
          );
        })
      )
      .handle("remove", ({ params }) =>
        Effect.gen(function* () {
          const context = yield* access(params.workspaceId, "computer:write");
          yield* computers.remove(
            context.workspace.workspaceId,
            context.auth.userId
          );
          return { deleted: true };
        })
      )
      .handle("listTasks", ({ params }) =>
        Effect.gen(function* () {
          const context = yield* access(params.workspaceId, "computer:read");
          return yield* computers.listTasks(
            context.workspace.workspaceId,
            context.auth.userId
          );
        })
      )
      .handle("runTask", ({ params, payload }) =>
        Effect.gen(function* () {
          const context = yield* access(params.workspaceId, "computer:write");
          const timeoutSeconds = Math.floor(payload.timeoutSeconds ?? 300);
          if (
            timeoutSeconds < 1 ||
            timeoutSeconds > 300 ||
            payload.command.length > 20_000 ||
            payload.objective.length < 1 ||
            payload.objective.length > 20_000 ||
            payload.idempotencyKey.length < 1 ||
            payload.idempotencyKey.length > 200
          ) {
            return yield* new ConflictError({
              message: "Task limits are invalid",
              resource: "agent-task",
            });
          }
          return yield* computers.runTask({
            workspaceId: context.workspace.workspaceId,
            userId: context.auth.userId,
            objective: payload.objective,
            command: payload.command,
            workingDirectory: payload.workingDirectory,
            idempotencyKey: payload.idempotencyKey,
            timeoutSeconds,
          });
        })
      );
  })
).pipe(Layer.provide(AuthenticationLive));

export const WorkspaceFileHandlers = HttpApiBuilder.group(
  Api,
  "workspaceFiles",
  Effect.fnUntraced(function* (handlers) {
    const files = yield* WorkspaceFileService;
    const workspaces = yield* WorkspaceAccessService;
    const access = (workspaceId: string, scope: "files:read" | "files:write") =>
      Effect.gen(function* () {
        const auth = yield* CurrentAuth;
        return {
          auth,
          workspace: yield* workspaces.require({ workspaceId, auth, scope }),
        };
      });
    return handlers
      .handle("list", ({ params }) =>
        Effect.gen(function* () {
          const context = yield* access(params.workspaceId, "files:read");
          return yield* files.list(
            context.workspace.workspaceId,
            context.auth.userId
          );
        })
      )
      .handle("get", ({ params }) =>
        Effect.gen(function* () {
          const context = yield* access(params.workspaceId, "files:read");
          return yield* files.get(
            context.workspace.workspaceId,
            params.id,
            context.auth.userId
          );
        })
      )
      .handle("createUpload", ({ params, payload }) =>
        Effect.gen(function* () {
          const context = yield* access(params.workspaceId, "files:write");
          return yield* files.createUpload({
            workspaceId: context.workspace.workspaceId,
            userId: context.auth.userId,
            logicalPath: payload.logicalPath,
            filename: payload.filename,
            mimeType: payload.mimeType,
            sizeBytes: payload.sizeBytes,
            sha256: payload.sha256,
            visibility: payload.visibility ?? "private",
            source: "upload",
          });
        })
      )
      .handle("completeUpload", ({ params, payload }) =>
        Effect.gen(function* () {
          const context = yield* access(params.workspaceId, "files:write");
          return yield* files.completeUpload(
            context.workspace.workspaceId,
            params.id,
            payload.versionId,
            context.auth.userId,
            context.workspace.billingOwnerUserId
          );
        })
      )
      .handle("download", ({ params }) =>
        Effect.gen(function* () {
          const context = yield* access(params.workspaceId, "files:read");
          return yield* files.download(
            context.workspace.workspaceId,
            params.id,
            context.auth.userId
          );
        })
      )
      .handle("remove", ({ params }) =>
        Effect.gen(function* () {
          const context = yield* access(params.workspaceId, "files:write");
          yield* files.remove(
            context.workspace.workspaceId,
            params.id,
            context.auth.userId,
            context.workspace.billingOwnerUserId
          );
          return { deleted: true };
        })
      );
  })
).pipe(Layer.provide(AuthenticationLive));
