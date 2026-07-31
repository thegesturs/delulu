import { Effect } from "effect";
import { type ConnectionError, profileNotFound, tokenExpired } from "../errors";
import { getConnection } from "../registry";
import { ConnectionStore } from "./connection-store";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

/**
 * Return a valid access token for a social provider, refreshing first when it
 * is within two hours of expiry and the platform supports refresh.
 *
 * Centralises what used to be inline per-caller refresh (e.g. TikTok in
 * `social-provider.ts`). Isomorphic: refresh itself is `fetch`-based and lives
 * on `connection.auth.refreshToken`, so this runs on both tRPC and worker.
 */
export const ensureFreshToken = (
  socialProviderId: string
): Effect.Effect<string, ConnectionError, ConnectionStore> =>
  Effect.gen(function* () {
    const store = yield* ConnectionStore;
    const loadProvider = () =>
      store.getSocialProviderWithDecryptedTokens(socialProviderId);
    const provider = yield* loadProvider();

    if (!provider?.accessToken) {
      return yield* Effect.fail(profileNotFound("token-service"));
    }

    const needsRefresh =
      provider.expiresIn !== undefined &&
      provider.expiresIn < Date.now() + TWO_HOURS_MS;

    if (!needsRefresh) {
      return provider.accessToken;
    }
    if (!provider.refreshToken) {
      return provider.expiresIn !== undefined &&
        provider.expiresIn <= Date.now()
        ? yield* Effect.fail(
            tokenExpired(
              provider.socialType,
              "Access token expired and the account must be reconnected"
            )
          )
        : provider.accessToken;
    }

    const refreshCurrentToken = Effect.gen(function* () {
      // Another worker may have completed the refresh while this worker waited
      // for the per-connection lock, so always re-read the durable row.
      const current = yield* loadProvider();
      if (!current?.accessToken) {
        return yield* Effect.fail(profileNotFound("token-service"));
      }
      const stillNeedsRefresh =
        current.expiresIn !== undefined &&
        current.expiresIn < Date.now() + TWO_HOURS_MS;
      if (!stillNeedsRefresh) {
        return current.accessToken;
      }
      if (!current.refreshToken) {
        return current.expiresIn !== undefined &&
          current.expiresIn <= Date.now()
          ? yield* Effect.fail(
              tokenExpired(
                current.socialType,
                "Access token expired and the account must be reconnected"
              )
            )
          : current.accessToken;
      }

      const refresh = getConnection(current.socialType).auth.refreshToken;
      if (!refresh) {
        return current.expiresIn !== undefined &&
          current.expiresIn <= Date.now()
          ? yield* Effect.fail(
              tokenExpired(
                current.socialType,
                "Access token expired and the account must be reconnected"
              )
            )
          : current.accessToken;
      }
      const refreshed = yield* refresh({
        socialProviderId,
        refreshToken: current.refreshToken,
      });
      yield* store.updateSocialProvider({
        socialProviderId,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresIn: refreshed.expiresIn,
      });
      return refreshed.accessToken;
    });

    return yield* store.withTokenRefreshLock
      ? store.withTokenRefreshLock(socialProviderId, refreshCurrentToken)
      : refreshCurrentToken;
  });
