import { Context } from "effect";
import type { Scope } from "./domain/auth";
import type { WorkspaceRole } from "./domain/workspace-member";
import type { MemberId, OrgId, UserId, WorkspaceId } from "./kernel/ids";

export class CurrentUser extends Context.Service<
  CurrentUser,
  { readonly id: UserId }
>()("@delulu/core/CurrentUser") {}

export class CurrentOrg extends Context.Service<
  CurrentOrg,
  { readonly id: OrgId }
>()("@delulu/core/CurrentOrg") {}

/** How the caller proved their identity for this request. */
export type CredentialKind = "session" | "oauth" | "apiKey";

/**
 * The resolved authentication context for a request. Credentials prove
 * identity only — the workspace and live role are resolved separately from the
 * path + Postgres. `scopes` is `"full"` for a trusted first-party session, or a
 * concrete scope list for delegated (OAuth / API-key) credentials. API keys
 * additionally carry a frozen role and a workspace binding.
 */
export interface AuthContext {
  readonly userId: UserId;
  readonly credential: CredentialKind;
  readonly scopes: readonly Scope[] | "full";
  readonly frozenRole?: WorkspaceRole;
  readonly keyWorkspaceId?: WorkspaceId;
}

export class CurrentAuth extends Context.Service<CurrentAuth, AuthContext>()(
  "@delulu/core/CurrentAuth"
) {}

export class CurrentWorkspace extends Context.Service<
  CurrentWorkspace,
  { readonly id: WorkspaceId; readonly billingOwnerUserId: UserId }
>()("@delulu/core/CurrentWorkspace") {}

export class CurrentMember extends Context.Service<
  CurrentMember,
  { readonly memberId: MemberId; readonly role: WorkspaceRole }
>()("@delulu/core/CurrentMember") {}
