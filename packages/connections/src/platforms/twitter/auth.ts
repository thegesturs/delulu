import { Effect } from "effect";
import { callbackRedirect } from "../../callback-response";
import {
  type ConnectionError,
  fromUnknownHttp,
  networkError,
  tokenExpired,
} from "../../errors";
import type {
  CallbackContext,
  ConnectContext,
  PlatformAuth,
  TokenRefreshResult,
} from "../../types";
import { SCOPES } from "./constants";

/**
 * Twitter env — read directly off `process.env` (isomorphic: Node worker +
 * workerd via nodejs_compat). We do NOT touch `src/env.ts`, which is
 * Instagram-scoped.
 */
const twitterEnv = () => ({
  TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID ?? "",
  TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET ?? "",
  TWITTER_CALLBACK_URL: process.env.TWITTER_CALLBACK_URL ?? "",
  TWITTER_STATE: process.env.TWITTER_STATE ?? "",
});

interface TwitterTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}
interface TwitterUserResponse {
  data: {
    id: string;
    name: string;
    username: string;
    profile_image_url?: string;
  };
}

const TIMEOUT_MS = 8000; // matches the old callback route

const fetchTimeout = (
  url: string,
  init?: RequestInit,
  timeoutMs = TIMEOUT_MS
) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
};

/** Basic auth header from client id/secret (workerd-safe, no Buffer). */
const basicAuth = (clientId: string, clientSecret: string): string =>
  btoa(`${clientId}:${clientSecret}`);

export const twitterAuth: PlatformAuth = {
  scopes: SCOPES,
  isMultiStep: false,

  getConnectUrl(ctx?: ConnectContext): string {
    const e = twitterEnv();
    const params = new URLSearchParams({
      response_type: "code",
      client_id: e.TWITTER_CLIENT_ID,
      redirect_uri: e.TWITTER_CALLBACK_URL,
      scope: SCOPES.join(" "),
      state: ctx?.state ?? e.TWITTER_STATE,
      code_challenge: "challenge",
      code_challenge_method: "plain",
    });
    return `https://x.com/i/oauth2/authorize?${params.toString()}`;
  },

  /**
   * OAuth callback. The API verifies state and supplies persistence through
   * `CallbackContext`; everything else (code exchange,
   * profile fetch, upsert) lives here. Returns redirect Responses matching the
   * old route's error codes/paths.
   */
  async handleCallback(ctx: CallbackContext): Promise<Response> {
    const { code } = ctx;
    const e = twitterEnv();

    // The old route required both `state` and `code`; the thin route validates
    // state (CSRF) and only forwards `code`. A missing code → same PARAM_001.
    if (!code) {
      return callbackRedirect(
        "/socials?error=invalid_request&code=PARAM_001&provider=TWITTER"
      );
    }

    try {
      const bearerToken = basicAuth(
        e.TWITTER_CLIENT_ID,
        e.TWITTER_CLIENT_SECRET
      );

      // 1. Exchange the authorization code for tokens.
      const tokenResponse = await fetchTimeout(
        "https://api.twitter.com/2/oauth2/token",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${bearerToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            code,
            grant_type: "authorization_code",
            redirect_uri: e.TWITTER_CALLBACK_URL,
            code_verifier: "challenge",
          }).toString(),
        }
      ).catch((error) => {
        console.error("Twitter token fetch error:", error);
        throw new Error("twitter_auth_failed");
      });

      if (!tokenResponse.ok) {
        throw new Error("twitter_token_invalid");
      }

      const { access_token, refresh_token, expires_in } =
        (await tokenResponse.json()) as TwitterTokenResponse;

      // 2. Fetch the authenticated user's profile.
      const userResponse = await fetchTimeout(
        "https://api.twitter.com/2/users/me?user.fields=username,profile_image_url,name,id",
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      if (!userResponse.ok) {
        throw new Error("twitter_user_fetch_failed");
      }

      const { data: userObject } =
        (await userResponse.json()) as TwitterUserResponse;
      if (!userObject) {
        throw new Error("twitter_user_fetch_failed");
      }

      // 3. Upsert social provider (per-call client carrying the user's token).
      const connection = {
        socialType: "TWITTER",
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: Date.now() + expires_in * 1000,
        profileId: userObject.id,
        username: userObject.username,
        fullName: userObject.name ?? "",
        profileImage: userObject.profile_image_url ?? "",
      } as const;
      const status = await ctx.upsert(connection);

      if (status === "transfer_required") {
        return callbackRedirect(
          "/socials?notification=account_transferred&platform=twitter"
        );
      }

      ctx.onConnected?.({ provider: "twitter", username: userObject.username });
      return callbackRedirect("/socials?success=true&provider=twitter");
    } catch (error) {
      console.error("Twitter callback error:", error);
      const errorType =
        error instanceof Error ? error.message : "internal_error";
      return callbackRedirect(
        `/socials?error=${errorType}&code=TWITTER_ERR&provider=TWITTER`
      );
    }
  },

  /**
   * Refresh an expired OAuth2 access token using the `offline.access` refresh
   * token. Ported from the provider's `refreshAccessToken`, but as an Effect
   * using `fetch` (workerd-safe) instead of the XDK `OAuth2` helper.
   */
  refreshToken({
    refreshToken,
  }): Effect.Effect<TokenRefreshResult, ConnectionError> {
    return Effect.gen(function* () {
      const e = twitterEnv();
      const bearerToken = basicAuth(
        e.TWITTER_CLIENT_ID,
        e.TWITTER_CLIENT_SECRET
      );

      const response = yield* Effect.tryPromise({
        try: () =>
          fetchTimeout("https://api.twitter.com/2/oauth2/token", {
            method: "POST",
            headers: {
              Authorization: `Basic ${bearerToken}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: refreshToken,
            }).toString(),
          }),
        catch: () => networkError("Twitter", "token refresh"),
      });

      if (!response.ok) {
        return yield* Effect.fail(
          tokenExpired("Twitter", "Failed to refresh Twitter access token")
        );
      }

      const data = yield* Effect.tryPromise({
        try: () => response.json() as Promise<TwitterTokenResponse>,
        catch: (err) => fromUnknownHttp("Twitter", err),
      });

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? refreshToken,
        expiresIn: Date.now() + (data.expires_in ?? 7200) * 1000,
      } satisfies TokenRefreshResult;
    });
  },
};
