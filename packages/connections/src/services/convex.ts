import { ConvexHttpClient } from "convex/browser";
import { Context, Effect, Layer } from "effect";
import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import type { PublishableSocialType } from "../types";
import { type ConnectionError, networkError } from "../errors";

/** The decrypted social-provider record we read from Convex. */
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

/**
 * Convex access as an Effect service (medium-depth DI). Publish + token-service
 * depend on this tag; the worker provides `ConvexClientLive`, tests provide a
 * stub layer. Keeps the Convex read/write boundary in one place instead of
 * scattered `convex.query(...)` calls.
 */
export class ConvexClient extends Context.Tag("@delulu/connections/ConvexClient")<
  ConvexClient,
  {
    readonly getSocialProviderWithDecryptedTokens: (
      id: string
    ) => Effect.Effect<SocialProviderTokens | null, ConnectionError>;
    readonly updateSocialProvider: (
      update: SocialProviderUpdate
    ) => Effect.Effect<void, ConnectionError>;
  }
>() {}

/** Live layer backed by the Convex HTTP client (fetch-based, isomorphic). */
export const ConvexClientLive = Layer.sync(ConvexClient, () => {
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL ?? "");
  return {
    getSocialProviderWithDecryptedTokens: (id) =>
      Effect.tryPromise({
        try: () =>
          client.query(
            api.social_providers.getSocialProviderWithDecryptedTokens,
            { id: id as Id<"socialProviders"> }
          ) as Promise<SocialProviderTokens | null>,
        catch: () => networkError("Convex", "getSocialProviderWithDecryptedTokens"),
      }),
    updateSocialProvider: (update) =>
      Effect.tryPromise({
        try: () =>
          client.mutation(api.social_providers.updateSocialProvider, {
            id: update.socialProviderId as Id<"socialProviders">,
            ...(update.accessToken !== undefined && { accessToken: update.accessToken }),
            ...(update.refreshToken !== undefined && { refreshToken: update.refreshToken }),
            ...(update.expiresIn !== undefined && { expiresIn: update.expiresIn }),
          }),
        catch: () => networkError("Convex", "updateSocialProvider"),
      }).pipe(Effect.asVoid),
  };
});
