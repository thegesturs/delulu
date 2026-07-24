import { Effect } from "effect";
import { nanoid } from "nanoid";
import {
  callbackRedirect,
  transferRequiredRedirect,
} from "../../callback-response";
import { type ConnectionError, networkError, tokenExpired } from "../../errors";
import type {
  CallbackContext,
  ConnectContext,
  PlatformAuth,
  TokenRefreshResult,
} from "../../types";
import {
  AUTHORIZE_URL,
  OAUTH_TOKEN_URL,
  PROVIDER,
  SCOPES,
  USER_INFO_URL,
} from "./constants";

/**
 * TikTok reads its OAuth config off `process.env` directly (the shared `env()`
 * helper only carries Instagram vars, which we must not edit). Note
 * TikTok's OAuth uses `client_key` — not `client_id`.
 */
const tiktokEnv = () => ({
  TIKTOK_CLIENT_ID: process.env.TIKTOK_CLIENT_ID ?? "",
  TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET ?? "",
  TIKTOK_CALLBACK_URL: process.env.TIKTOK_CALLBACK_URL ?? "",
});

interface TikTokTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  open_id: string;
  scope: string;
}
interface TikTokUserResponse {
  data: {
    user: {
      display_name: string;
      avatar_url: string;
      username: string;
    };
  };
}
interface TikTokRefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

const fetchTimeout = (url: string, init?: RequestInit, timeoutMs = 15_000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
};

export const tiktokAuth: PlatformAuth = {
  scopes: SCOPES.split(","),
  isMultiStep: false,

  getConnectUrl(_ctx?: ConnectContext): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_key: tiktokEnv().TIKTOK_CLIENT_ID,
      redirect_uri: tiktokEnv().TIKTOK_CALLBACK_URL,
      scope: SCOPES,
      state: _ctx?.state ?? nanoid(10),
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  },

  /**
   * OAuth callback. The API verifies state and supplies persistence through
   * `CallbackContext`; the code exchange, profile fetch
   * and upsert live here. Redirect Responses preserve the old route's exact
   * Location + error codes.
   */
  async handleCallback(ctx: CallbackContext): Promise<Response> {
    const { code } = ctx;
    const e = tiktokEnv();

    // The old route required both `state` and `code`; CallbackContext only
    // carries `code`, and a missing code is the observable failure case.
    if (!code) {
      return callbackRedirect(
        "/socials?error=invalid_request&code=PARAM_001&provider=TIKTOK"
      );
    }

    try {
      // 1. Exchange code for access token
      const tokenResponse = await fetchTimeout(OAUTH_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Cache-Control": "no-cache",
        },
        body: new URLSearchParams({
          client_key: e.TIKTOK_CLIENT_ID,
          client_secret: e.TIKTOK_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: e.TIKTOK_CALLBACK_URL,
        }).toString(),
      });

      if (!tokenResponse.ok) {
        return callbackRedirect(
          "/socials?error=auth_failed&code=AUTH_002&provider=TIKTOK"
        );
      }

      const response = (await tokenResponse.json()) as TikTokTokenResponse;
      const { access_token, refresh_token, expires_in, open_id } = response;

      // 2. Get TikTok user data
      const userResponse = await fetchTimeout(USER_INFO_URL, {
        method: "GET",
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (!userResponse.ok) {
        return callbackRedirect(
          "/socials?error=auth_failed&code=AUTH_002&provider=TIKTOK"
        );
      }

      const userData = (await userResponse.json()) as TikTokUserResponse;
      if (!userData.data?.user) {
        return callbackRedirect(
          "/socials?error=auth_failed&code=AUTH_002&provider=TIKTOK"
        );
      }

      const { username, display_name, avatar_url } = userData.data.user;

      // 3. Upsert social provider (per-call client carrying the user's token)
      const connection = {
        socialType: "TIKTOK",
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: Date.now() + expires_in * 1000,
        profileId: open_id,
        username,
        fullName: display_name,
        profileImage: avatar_url,
      } as const;
      const result = await ctx.upsert(connection);

      if (result.status === "transfer_required") {
        return transferRequiredRedirect({ platform: "tiktok", ...result });
      }

      ctx.onConnected?.({ provider: "tiktok", username });
      return callbackRedirect("/socials?success=true&provider=TIKTOK");
    } catch (err) {
      console.error("TikTok callback error:", err);
      return callbackRedirect(
        "/socials?error=auth_failed&code=AUTH_002&provider=TIKTOK"
      );
    }
  },

  /**
   * Refresh an expired access token. Ported from the inline refresh block in
   * `social-provider.ts` (POST /v2/oauth/token/, grant_type=refresh_token,
   * client_key/client_secret). Returns the new token pair + absolute expiry.
   */
  refreshToken(input): Effect.Effect<TokenRefreshResult, ConnectionError> {
    return Effect.gen(function* () {
      const e = tiktokEnv();
      const response = yield* Effect.tryPromise({
        try: () =>
          fetchTimeout(OAUTH_TOKEN_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Cache-Control": "no-cache",
            },
            body: new URLSearchParams({
              client_key: e.TIKTOK_CLIENT_ID,
              client_secret: e.TIKTOK_CLIENT_SECRET,
              grant_type: "refresh_token",
              refresh_token: input.refreshToken,
            }).toString(),
          }),
        catch: () => networkError(PROVIDER, "refreshToken"),
      });

      if (!response.ok) {
        return yield* Effect.fail(
          tokenExpired(PROVIDER, "Failed to refresh TikTok access token")
        );
      }

      const data = yield* Effect.tryPromise({
        try: () => response.json() as Promise<TikTokRefreshResponse>,
        catch: () => networkError(PROVIDER, "refreshToken"),
      });

      if (!data.access_token) {
        return yield* Effect.fail(
          tokenExpired(PROVIDER, "No access token received on refresh")
        );
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: Date.now() + data.expires_in * 1000,
      } satisfies TokenRefreshResult;
    });
  },
};
