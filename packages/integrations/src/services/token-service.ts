import { Effect } from "effect";
import { type IntegrationError, profileNotFound } from "../errors";
import { getIntegration } from "../registry";
import { ConvexClient } from "./convex";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

/**
 * Return a valid access token for a social provider, refreshing first when it
 * is within two hours of expiry and the platform supports refresh.
 *
 * Centralises what used to be inline per-caller refresh (e.g. TikTok in
 * `social-provider.ts`). Isomorphic: refresh itself is `fetch`-based and lives
 * on `integration.auth.refreshToken`, so this runs on both tRPC and worker.
 */
export const ensureFreshToken = (
  socialProviderId: string
): Effect.Effect<string, IntegrationError, ConvexClient> =>
  Effect.gen(function* () {
    const convex = yield* ConvexClient;
    const provider = yield* convex.getSocialProviderWithDecryptedTokens(socialProviderId);

    if (!provider?.accessToken) {
      return yield* Effect.fail(profileNotFound("token-service"));
    }

    const needsRefresh =
      provider.expiresIn !== undefined &&
      provider.expiresIn < Date.now() + TWO_HOURS_MS;

    if (!needsRefresh || !provider.refreshToken) {
      return provider.accessToken;
    }

    const integration = getIntegration(provider.socialType);
    const refresh = integration.auth.refreshToken;
    if (!refresh) {
      // Platform has no refresh flow (e.g. long-lived Instagram tokens) — use
      // the existing token; the API call fails loudly if it is actually stale.
      return provider.accessToken;
    }

    // Best-effort refresh: if it fails, fall back to the current token rather
    // than hard-failing the caller (preserves prior TikTok behaviour).
    const refreshed = yield* refresh({
      socialProviderId,
      refreshToken: provider.refreshToken,
    }).pipe(Effect.option);

    if (refreshed._tag === "None") {
      return provider.accessToken;
    }

    yield* convex.updateSocialProvider({
      socialProviderId,
      accessToken: refreshed.value.accessToken,
      refreshToken: refreshed.value.refreshToken,
      expiresIn: refreshed.value.expiresIn,
    });

    return refreshed.value.accessToken;
  });
