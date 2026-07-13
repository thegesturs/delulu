import { Effect } from "effect";
import { nanoid } from "nanoid";
import { callbackRedirect } from "../../callback-response";
import {
  type ConnectionError,
  fromUnknownHttp,
  tokenExpired,
} from "../../errors";
import type {
  CallbackContext,
  ConnectContext,
  PlatformAuth,
  TokenRefreshResult,
} from "../../types";
import { API_BASE } from "./constants";

const igEnv = () => ({
  clientId: process.env.PINTEREST_CLIENT_ID ?? "",
  clientSecret: process.env.PINTEREST_CLIENT_SECRET ?? "",
  callbackUrl: process.env.PINTEREST_CALLBACK_URL ?? "",
});

const fetchTimeout = (url: string, init?: RequestInit, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
};

interface PinterestTokenResponse {
  access_token: string;
  refresh_token: string;
}
interface PinterestUserResponse {
  username: string;
  profile_image: string;
}

export const pinterestAuth: PlatformAuth = {
  scopes: ["boards:read", "pins:write"],
  isMultiStep: false,

  getConnectUrl(ctx?: ConnectContext): string {
    const e = igEnv();
    const params = new URLSearchParams({
      client_id: e.clientId,
      redirect_uri: e.callbackUrl,
      response_type: "code",
      scope: "boards:read,pins:write",
      state: ctx?.state ?? nanoid(),
    });
    return `https://www.pinterest.com/oauth/?${params.toString()}`;
  },

  async handleCallback(ctx: CallbackContext): Promise<Response> {
    const { code, error } = ctx;
    const e = igEnv();

    if (error === "access_denied") {
      return callbackRedirect(
        "/socials?error=user_denied&code=PINTEREST_001&provider=pinterest"
      );
    }
    if (!code) {
      return callbackRedirect(
        "/socials?error=invalid_request&code=PARAM_001&provider=pinterest"
      );
    }

    try {
      const tokenResponse = await fetchTimeout(`${API_BASE}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: e.clientId,
          client_secret: e.clientSecret,
          redirect_uri: e.callbackUrl,
          code,
        }).toString(),
      });
      if (!tokenResponse.ok) {
        return callbackRedirect(
          "/socials?error=token_invalid&code=PINTEREST_002&provider=pinterest"
        );
      }
      const tokenData = (await tokenResponse.json()) as PinterestTokenResponse;

      const userResponse = await fetchTimeout(`${API_BASE}/user_account`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (!userResponse.ok) {
        return callbackRedirect(
          "/socials?error=user_fetch_failed&code=PINTEREST_003&provider=pinterest"
        );
      }
      const user = (await userResponse.json()) as PinterestUserResponse;

      const connection = {
        socialType: "PINTEREST",
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: Date.now() + 3600 * 1000,
        profileId: user.username,
        username: user.username,
        fullName: user.username,
        profileImage: user.profile_image,
      } as const;
      const status = await ctx.upsert(connection);

      if (status === "transfer_required") {
        return callbackRedirect(
          "/socials?notification=account_transferred&platform=pinterest"
        );
      }
      ctx.onConnected?.({ provider: "pinterest", username: user.username });
      return callbackRedirect("/socials?success=true&provider=pinterest");
    } catch (err) {
      console.error("Pinterest callback error:", err);
      return callbackRedirect(
        "/socials?error=server_error&code=PINTEREST_500&provider=pinterest"
      );
    }
  },

  refreshToken({
    refreshToken,
  }): Effect.Effect<TokenRefreshResult, ConnectionError> {
    const e = igEnv();
    return Effect.gen(function* () {
      const data = yield* Effect.tryPromise({
        try: () =>
          fetchTimeout(`${API_BASE}/oauth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: refreshToken,
              client_id: e.clientId,
              client_secret: e.clientSecret,
            }).toString(),
          }).then((r) => {
            if (!r.ok) {
              throw new Error(`Pinterest refresh failed: ${r.status}`);
            }
            return r.json() as Promise<{
              access_token: string;
              refresh_token?: string;
              expires_in?: number;
            }>;
          }),
        catch: () => tokenExpired("Pinterest", "refresh failed"),
      });
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: Date.now() + (data.expires_in ?? 3600) * 1000,
      };
    });
  },
};
