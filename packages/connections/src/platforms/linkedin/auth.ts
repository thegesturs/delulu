import { Effect } from "effect";
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
import { LINKEDIN_VERSION } from "./constants";

/**
 * Least-required member publishing scopes. Identity comes from LinkedIn OIDC;
 * organization publishing is requested separately when that capability exists.
 */
const SCOPES = ["openid", "profile", "w_member_social"];

interface LinkedInResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
}

interface LinkedInUserResponse {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export const linkedinAuth: PlatformAuth = {
  scopes: SCOPES,
  isMultiStep: false,

  /**
   * OAuth authorize URL. Ported from the connect-url service LINKEDIN block;
   * reads env directly (the shared `env()` helper only carries Instagram vars).
   */
  getConnectUrl(ctx?: ConnectContext): string {
    const clientId = process.env.LINKEDIN_CLIENT_ID ?? "";
    const callbackUrl = process.env.LINKEDIN_CALLBACK_URL ?? "";
    const scopes = SCOPES.join("%20");

    const state = ctx?.state ? `&state=${encodeURIComponent(ctx.state)}` : "";
    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${callbackUrl}&scope=${scopes}${state}`;
  },

  /**
   * OAuth callback. The API verifies state and supplies persistence through
   * `CallbackContext`; code exchange, profile fetch, and
   * upsert live here. Returns redirect Responses preserving the old route's
   * exact Location paths and error codes.
   */
  async handleCallback(ctx: CallbackContext): Promise<Response> {
    const { code } = ctx;
    const clientId = process.env.LINKEDIN_CLIENT_ID ?? "";
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET ?? "";
    const callbackUrl = process.env.LINKEDIN_CALLBACK_URL ?? "";

    if (!code) {
      return callbackRedirect(
        "/socials?error=invalid_request&code=PARAM_001&provider=LINKEDIN"
      );
    }

    try {
      // 1. Exchange the authorization code for an access token.
      const tokenResponse = await fetch(
        "https://www.linkedin.com/oauth/v2/accessToken",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: callbackUrl,
            client_id: clientId,
            client_secret: clientSecret,
          }),
        }
      ).catch((error) => {
        console.error("LinkedIn token fetch error:", error);
        throw new Error("linkedin_auth_failed");
      });

      if (!tokenResponse.ok) {
        throw new Error("linkedin_token_invalid");
      }

      const {
        access_token,
        expires_in,
        refresh_token,
        refresh_token_expires_in,
      } = (await tokenResponse.json()) as LinkedInResponse;

      // 2. Fetch the user profile.
      const userResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "X-Restli-Protocol-Version": "2.0.0",
          "LinkedIn-Version": LINKEDIN_VERSION,
        },
      });

      if (!userResponse.ok) {
        throw new Error("linkedin_user_fetch_failed");
      }

      const userObject = (await userResponse.json()) as LinkedInUserResponse;

      // LinkedIn's API exposes no public @handle, so we don't fabricate one —
      // the account surfaces under its full name only. (`expiresIn` is the
      // access-token expiry; LinkedIn issues no refresh token here, so this is
      // the genuine re-auth deadline.)
      const fullName =
        userObject.name ||
        `${userObject.given_name ?? ""} ${userObject.family_name ?? ""}`.trim();

      // 3. Upsert social provider (per-call client carrying the user's token).
      const connection = {
        socialType: "LINKEDIN",
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: Date.now() + expires_in * 1000,
        refreshTokenExpiresIn: refresh_token_expires_in
          ? Date.now() + refresh_token_expires_in * 1000
          : undefined,
        profileId: userObject.sub,
        fullName,
        profileImage: userObject.picture ?? "/images/user.png",
      } as const;
      const result = await ctx.upsert(connection);

      if (result.status === "transfer_required") {
        return transferRequiredRedirect({ platform: "linkedin", ...result });
      }

      ctx.onConnected?.({ provider: "linkedin", username: fullName });
      return callbackRedirect("/socials");
    } catch (error) {
      console.error("LinkedIn callback error:", error);
      const errorType =
        error instanceof Error ? error.message : "internal_error";
      return callbackRedirect(
        `/socials?error=${errorType}&code=LINKEDIN_ERR&provider=LINKEDIN`
      );
    }
  },

  refreshToken({
    refreshToken,
  }): Effect.Effect<TokenRefreshResult, ConnectionError> {
    return Effect.gen(function* () {
      const response = yield* Effect.tryPromise({
        try: () =>
          fetch("https://www.linkedin.com/oauth/v2/accessToken", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: refreshToken,
              client_id: process.env.LINKEDIN_CLIENT_ID ?? "",
              client_secret: process.env.LINKEDIN_CLIENT_SECRET ?? "",
            }),
          }),
        catch: () => networkError("LinkedIn", "token refresh"),
      });
      if (!response.ok) {
        return yield* Effect.fail(
          tokenExpired("LinkedIn", "Failed to refresh LinkedIn access token")
        );
      }
      const data = yield* Effect.tryPromise({
        try: () => response.json() as Promise<LinkedInResponse>,
        catch: () => networkError("LinkedIn", "token refresh response"),
      });
      if (!data.access_token) {
        return yield* Effect.fail(
          tokenExpired("LinkedIn", "LinkedIn returned no access token")
        );
      }
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? refreshToken,
        expiresIn: Date.now() + data.expires_in * 1000,
      } satisfies TokenRefreshResult;
    });
  },
};
