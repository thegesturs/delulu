import { Context } from "effect";
import type { OrgId, UserId } from "./kernel/ids";

export class CurrentUser extends Context.Service<
  CurrentUser,
  { readonly id: UserId }
>()("@delulu/core/CurrentUser") {}

export class CurrentOrg extends Context.Service<
  CurrentOrg,
  { readonly id: OrgId }
>()("@delulu/core/CurrentOrg") {}
