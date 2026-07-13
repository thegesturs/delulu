import { Context, type Effect } from "effect";
import type { ConnectionError } from "../errors";
import type { PublishableSocialType } from "../types";

export interface SocialProviderTokens {
  _id: string;
  socialType: PublishableSocialType;
  accessToken: string;
  refreshToken?: string;
  profileId?: string;
  username?: string;
  expiresIn?: number;
  refreshTokenExpiresIn?: number;
}

export interface SocialProviderUpdate {
  socialProviderId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}

/** Storage-neutral token access used by the publishing runtime. */
export class ConnectionStore extends Context.Service<
  ConnectionStore,
  {
    readonly getSocialProviderWithDecryptedTokens: (
      id: string
    ) => Effect.Effect<SocialProviderTokens | null, ConnectionError>;
    readonly updateSocialProvider: (
      update: SocialProviderUpdate
    ) => Effect.Effect<void, ConnectionError>;
  }
>()("@delulu/connections/ConnectionStore") {}
