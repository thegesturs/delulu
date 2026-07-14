import { WorkspaceRole } from "@delulu/core";
import { Schema } from "effect";
import {
  HttpApiEndpoint,
  HttpApiGroup,
  OpenApi,
} from "effect/unstable/httpapi";
import { Authentication } from "./middleware";

/** The authenticated user, plus their personal workspace (identity tier). */
export const MeResponse = Schema.Struct({
  user: Schema.Struct({
    id: Schema.String,
    externalId: Schema.String,
    email: Schema.NullOr(Schema.String),
    name: Schema.NullOr(Schema.String),
    imageUrl: Schema.NullOr(Schema.String),
  }),
  personalWorkspace: Schema.NullOr(
    Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      slug: Schema.NullOr(Schema.String),
    })
  ),
}).annotate({ identifier: "MeResponse" });

/** One membership row surfaced to a client so it can pick a workspace to bind. */
export const WorkspaceMembershipItem = Schema.Struct({
  workspaceId: Schema.String,
  name: Schema.String,
  slug: Schema.NullOr(Schema.String),
  isPersonal: Schema.Boolean,
  role: WorkspaceRole,
}).annotate({ identifier: "WorkspaceMembershipItem" });

/** Offset/limit list envelope (#148): numbered pages, `total` always present. */
export const MeWorkspacesResponse = Schema.Struct({
  data: Schema.Array(WorkspaceMembershipItem),
  total: Schema.Number,
  limit: Schema.Number,
  offset: Schema.Number,
}).annotate({ identifier: "MeWorkspacesResponse" });

export const EmailPreferencesResponse = Schema.Struct({
  productLifecycleEnabled: Schema.Boolean,
  marketingEnabled: Schema.Boolean,
});

export const MeGroup = HttpApiGroup.make("me")
  .add(
    HttpApiEndpoint.get("current", "/", {
      success: MeResponse,
    }).annotate(OpenApi.Summary, "Get the authenticated user")
  )
  .add(
    HttpApiEndpoint.get("emailPreferences", "/email-preferences", {
      success: EmailPreferencesResponse,
    }),
    HttpApiEndpoint.put("updateEmailPreferences", "/email-preferences", {
      payload: EmailPreferencesResponse,
      success: EmailPreferencesResponse,
    })
  )
  .add(
    HttpApiEndpoint.get("workspaces", "/workspaces", {
      success: MeWorkspacesResponse,
    }).annotate(OpenApi.Summary, "List the user's workspace memberships")
  )
  .middleware(Authentication)
  .prefix("/v1/me");
