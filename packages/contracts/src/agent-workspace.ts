import {
  AgentComputerState,
  AgentNetworkPolicy,
  AgentTaskStatus,
  WorkspaceFileSource,
  WorkspaceFileStatus,
  WorkspaceFileVisibility,
} from "@delulu/core";
import { Schema } from "effect";
import {
  HttpApiEndpoint,
  HttpApiGroup,
  OpenApi,
} from "effect/unstable/httpapi";
import {
  ConflictErrorResponse,
  ForbiddenErrorResponse,
  NotFoundErrorResponse,
  ProviderUnavailableErrorResponse,
  QuotaExceededErrorResponse,
  ValidationErrorResponse,
} from "./errors";
import { Authentication } from "./middleware";

const WorkspacePath = { workspaceId: Schema.String };
const ResourcePath = { workspaceId: Schema.String, id: Schema.String };
const Errors = [
  NotFoundErrorResponse,
  ForbiddenErrorResponse,
  ValidationErrorResponse,
  ConflictErrorResponse,
  ProviderUnavailableErrorResponse,
  QuotaExceededErrorResponse,
];

export const AgentComputerView = Schema.Struct({
  id: Schema.String,
  workspaceId: Schema.String,
  state: AgentComputerState,
  networkPolicy: AgentNetworkPolicy,
  environmentVersion: Schema.Number,
  lastActivityAt: Schema.String,
  failureReason: Schema.NullOr(Schema.String),
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export const AgentTaskView = Schema.Struct({
  id: Schema.String,
  computerId: Schema.String,
  workspaceId: Schema.String,
  objective: Schema.String,
  status: AgentTaskStatus,
  networkPolicy: AgentNetworkPolicy,
  exitCode: Schema.NullOr(Schema.Number),
  output: Schema.String,
  outputTruncated: Schema.Boolean,
  error: Schema.NullOr(Schema.String),
  createdAt: Schema.String,
  completedAt: Schema.NullOr(Schema.String),
});

export const AgentComputerGroup = HttpApiGroup.make("agentComputer")
  .add(
    HttpApiEndpoint.get("get", "/", {
      params: WorkspacePath,
      success: Schema.NullOr(AgentComputerView),
      error: Errors,
    }),
    HttpApiEndpoint.post("enable", "/", {
      params: WorkspacePath,
      payload: Schema.Struct({
        networkPolicy: Schema.optional(AgentNetworkPolicy),
        approvedDomains: Schema.optional(Schema.Array(Schema.String)),
      }),
      success: AgentComputerView,
      error: Errors,
    }),
    HttpApiEndpoint.post("resume", "/resume", {
      params: WorkspacePath,
      success: AgentComputerView,
      error: Errors,
    }),
    HttpApiEndpoint.post("pause", "/pause", {
      params: WorkspacePath,
      success: AgentComputerView,
      error: Errors,
    }),
    HttpApiEndpoint.delete("remove", "/", {
      params: WorkspacePath,
      success: Schema.Struct({ deleted: Schema.Boolean }),
      error: Errors,
    }),
    HttpApiEndpoint.get("listTasks", "/tasks", {
      params: WorkspacePath,
      success: Schema.Array(AgentTaskView),
      error: Errors,
    }),
    HttpApiEndpoint.post("runTask", "/tasks", {
      params: WorkspacePath,
      payload: Schema.Struct({
        objective: Schema.String,
        command: Schema.String,
        workingDirectory: Schema.optional(Schema.String),
        idempotencyKey: Schema.String,
        timeoutSeconds: Schema.optional(Schema.Number),
      }),
      success: AgentTaskView,
      error: Errors,
    })
  )
  .middleware(Authentication)
  .prefix("/v1/workspaces/:workspaceId/agent/computer")
  .annotate(OpenApi.Title, "Agent computer");

export const WorkspaceFileView = Schema.Struct({
  id: Schema.String,
  workspaceId: Schema.String,
  logicalPath: Schema.String,
  filename: Schema.String,
  visibility: WorkspaceFileVisibility,
  source: WorkspaceFileSource,
  status: WorkspaceFileStatus,
  versionId: Schema.NullOr(Schema.String),
  mimeType: Schema.NullOr(Schema.String),
  sizeBytes: Schema.NullOr(Schema.String),
  sha256: Schema.NullOr(Schema.String),
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export const WorkspaceFilesGroup = HttpApiGroup.make("workspaceFiles")
  .add(
    HttpApiEndpoint.get("list", "/", {
      params: WorkspacePath,
      success: Schema.Array(WorkspaceFileView),
      error: Errors,
    }),
    HttpApiEndpoint.get("get", "/:id", {
      params: ResourcePath,
      success: WorkspaceFileView,
      error: Errors,
    }),
    HttpApiEndpoint.post("createUpload", "/uploads", {
      params: WorkspacePath,
      payload: Schema.Struct({
        logicalPath: Schema.String,
        filename: Schema.String,
        mimeType: Schema.String,
        sizeBytes: Schema.Number,
        sha256: Schema.String,
        visibility: Schema.optional(WorkspaceFileVisibility),
      }),
      success: Schema.Struct({
        file: WorkspaceFileView,
        versionId: Schema.String,
        uploadUrl: Schema.String,
        uploadHeaders: Schema.Record(Schema.String, Schema.String),
      }),
      error: Errors,
    }),
    HttpApiEndpoint.post("completeUpload", "/:id/complete", {
      params: ResourcePath,
      payload: Schema.Struct({ versionId: Schema.String }),
      success: WorkspaceFileView,
      error: Errors,
    }),
    HttpApiEndpoint.get("download", "/:id/download", {
      params: ResourcePath,
      success: Schema.Struct({
        url: Schema.String,
        expiresInSeconds: Schema.Number,
      }),
      error: Errors,
    }),
    HttpApiEndpoint.delete("remove", "/:id", {
      params: ResourcePath,
      success: Schema.Struct({ deleted: Schema.Boolean }),
      error: Errors,
    })
  )
  .middleware(Authentication)
  .prefix("/v1/workspaces/:workspaceId/files")
  .annotate(OpenApi.Title, "Workspace files");
