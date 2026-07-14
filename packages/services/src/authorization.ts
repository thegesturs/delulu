import { ForbiddenError } from "@delulu/contracts";
import {
  type AuthContext,
  can,
  effectivePermissions,
  type Scope,
  type WorkspaceRole,
} from "@delulu/core";
import { Context, Effect, Layer } from "effect";

/**
 * Authorization = `rolePerms(role) ∩ scopes` (#149), plus the API-key workspace
 * binding. The applicable role is the frozen key role for API keys, else the
 * live membership role. First-party sessions carry `scopes: "full"` → the whole
 * role ceiling.
 */
export class AuthorizationService extends Context.Service<
  AuthorizationService,
  {
    /** Effective scopes for this credential at the given live role. */
    readonly effectiveScopes: (
      auth: AuthContext,
      liveRole: WorkspaceRole
    ) => readonly Scope[];
    /** Require a scope, else fail 403. */
    readonly requireScope: (
      auth: AuthContext,
      liveRole: WorkspaceRole,
      scope: Scope
    ) => Effect.Effect<void, ForbiddenError>;
    /** Enforce that an API key is used only within its bound workspace, else 403. */
    readonly enforceWorkspaceBinding: (
      auth: AuthContext,
      pathWorkspaceId: string
    ) => Effect.Effect<void, ForbiddenError>;
  }
>()("@delulu/services/AuthorizationService") {
  static readonly layer = Layer.succeed(
    AuthorizationService,
    AuthorizationService.of({
      effectiveScopes: (auth, liveRole) => {
        // API keys carry a frozen role capped at the creator's role at mint;
        // it is the ceiling on the hot path (no user live-role lookup).
        const role = auth.frozenRole ?? liveRole;
        return effectivePermissions(role, auth.scopes);
      },
      requireScope: (auth, liveRole, scope) =>
        Effect.suspend(() => {
          const role = auth.frozenRole ?? liveRole;
          const effective = effectivePermissions(role, auth.scopes);
          return can(effective, scope)
            ? Effect.void
            : Effect.fail(
                new ForbiddenError({
                  message: `Missing required scope: ${scope}`,
                })
              );
        }),
      enforceWorkspaceBinding: (auth, pathWorkspaceId) =>
        Effect.suspend(() => {
          // API keys and workspace-bound OAuth tokens may only act on the one
          // workspace they were pinned to; a session/unbound token is unaffected.
          if (
            auth.boundWorkspaceId !== undefined &&
            auth.boundWorkspaceId !== pathWorkspaceId
          ) {
            return Effect.fail(
              new ForbiddenError({
                message:
                  auth.credential === "apiKey"
                    ? "API key is not valid for this workspace"
                    : "This authorization is not valid for this workspace",
              })
            );
          }
          return Effect.void;
        }),
    })
  );
}
