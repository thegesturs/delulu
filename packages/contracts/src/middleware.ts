import type {
  CurrentAuth,
  CurrentMember,
  CurrentUser,
  CurrentWorkspace,
} from "@delulu/core";
import { HttpApiMiddleware, HttpApiSecurity } from "effect/unstable/httpapi";
import {
  ForbiddenErrorResponse,
  NotFoundErrorResponse,
  QuotaExceededErrorResponse,
  RateLimitedErrorResponse,
  UnauthorizedErrorResponse,
} from "./errors";

/**
 * Identity authentication + the post-auth request gate. One bearer scheme fronts
 * three verifiers (Clerk session JWT, our own AS token, API key) — dispatched by
 * the implementation in `apps/api`. After resolving identity it enforces the
 * per-credential rate limit and the pooled API-request budget, so it can also
 * fail 429/402 (#159). Provides `CurrentAuth` (and `CurrentUser`) to downstream
 * handlers. `requiredForClient` forces derived clients to supply a token
 * provider, keeping the contract honest end-to-end.
 */
export class Authentication extends HttpApiMiddleware.Service<
  Authentication,
  {
    provides: CurrentAuth | CurrentUser;
    requires: never;
  }
>()("@delulu/contracts/Authentication", {
  requiredForClient: true,
  security: { bearer: HttpApiSecurity.bearer },
  error: [
    UnauthorizedErrorResponse,
    RateLimitedErrorResponse,
    QuotaExceededErrorResponse,
  ],
}) {}

/**
 * Workspace-scoped membership resolution. Reads the `:workspaceId` path segment,
 * resolves the live role from `workspace_members`, and enforces API-key
 * workspace binding (path mismatch → 403). Attached to workspace-tier groups in
 * M2; defined here so the contract and its derived client agree from the start.
 */
export class WorkspaceMembership extends HttpApiMiddleware.Service<
  WorkspaceMembership,
  {
    provides: CurrentWorkspace | CurrentMember;
    requires: CurrentAuth;
  }
>()("@delulu/contracts/WorkspaceMembership", {
  error: [ForbiddenErrorResponse, NotFoundErrorResponse],
}) {}
