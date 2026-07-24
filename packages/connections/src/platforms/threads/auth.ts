import { nanoid } from "nanoid";
import {
  callbackRedirect,
  transferRequiredRedirect,
} from "../../callback-response";
import type {
  CallbackContext,
  ConnectContext,
  PlatformAuth,
} from "../../types";
import { GRAPH_VERSION } from "./constants";

/**
 * Threads scopes. Mirrors the connect-url THREADS block (single source of
 * truth for the OAuth authorize URL). Keep in sync with the authorize scope.
 */
const BASE_SCOPES = ["threads_basic", "threads_content_publish"];

/**
 * Threads env. `src/env.ts` only carries the Instagram vars and is
 * off-limits here, so we read the Threads vars straight off `process.env`
 * (isomorphic — present on Node + workerd via `keep_vars`).
 */
const threadsEnv = () => ({
  THREADS_CLIENT_ID: process.env.THREADS_CLIENT_ID ?? "",
  THREADS_CLIENT_SECRET: process.env.THREADS_CLIENT_SECRET ?? "",
  THREADS_CALLBACK_URL: process.env.THREADS_CALLBACK_URL ?? "",
});

interface ThreadsTokenResponse {
  access_token: string;
  user_id: string;
}
interface ThreadsLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}
interface ThreadsUser {
  id: string;
  username: string;
  name: string;
  threads_profile_picture_url: string;
}

const fetchTimeout = (url: string, init?: RequestInit, timeoutMs = 15_000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
};

export const threadsAuth: PlatformAuth = {
  scopes: BASE_SCOPES,
  isMultiStep: false,

  getConnectUrl(_ctx?: ConnectContext): string {
    const params = new URLSearchParams({
      client_id: threadsEnv().THREADS_CLIENT_ID,
      redirect_uri: threadsEnv().THREADS_CALLBACK_URL,
      response_type: "code",
      scope: BASE_SCOPES.join(","),
      state: _ctx?.state ?? nanoid(),
    });
    return `https://threads.net/oauth/authorize?${params.toString()}`;
  },

  /**
   * OAuth callback. The API verifies state and supplies persistence through
   * `CallbackContext`; everything else (code exchange,
   * long-lived token, profile fetch, upsert) lives here. Returns redirect
   * Responses matching the old route's exact error codes.
   */
  async handleCallback(ctx: CallbackContext): Promise<Response> {
    const { code, error, errorReason } = ctx;
    const e = threadsEnv();

    if (error === "access_denied" && errorReason === "user_denied") {
      return callbackRedirect(
        "/socials?error=user_denied&code=THREADS_001&provider=threads"
      );
    }
    if (!code) {
      return callbackRedirect(
        "/socials?error=invalid_request&code=PARAM_001&provider=threads"
      );
    }

    try {
      // 1. Short-lived token
      const tokenResponse = await fetchTimeout(
        "https://graph.threads.net/oauth/access_token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: e.THREADS_CLIENT_ID,
            client_secret: e.THREADS_CLIENT_SECRET,
            grant_type: "authorization_code",
            redirect_uri: e.THREADS_CALLBACK_URL,
            code,
          }).toString(),
        }
      );
      if (!tokenResponse.ok) {
        return callbackRedirect(
          "/socials?error=token_invalid&code=THREADS_002&provider=threads"
        );
      }
      const tokenData = (await tokenResponse.json()) as ThreadsTokenResponse;

      // 2. Long-lived token
      const longLivedResponse = await fetchTimeout(
        `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${e.THREADS_CLIENT_SECRET}&access_token=${tokenData.access_token}`
      );
      if (!longLivedResponse.ok) {
        console.error(
          "Threads long-lived token exchange failed:",
          await longLivedResponse.text()
        );
        return callbackRedirect(
          "/socials?error=token_invalid&code=THREADS_003&provider=threads"
        );
      }
      const longLived =
        (await longLivedResponse.json()) as ThreadsLongLivedTokenResponse;

      // 3. Profile
      const userResponse = await fetchTimeout(
        `https://graph.threads.net/${GRAPH_VERSION}/me?fields=id,username,name,threads_profile_picture_url&access_token=${longLived.access_token}`
      );
      if (!userResponse.ok) {
        console.error("Threads user fetch failed:", await userResponse.text());
        return callbackRedirect(
          "/socials?error=user_fetch_failed&code=THREADS_004&provider=threads"
        );
      }
      const user = (await userResponse.json()) as ThreadsUser;

      // 4. Upsert social provider (per-call client carrying the user's token)
      const connection = {
        socialType: "THREADS",
        accessToken: longLived.access_token,
        expiresIn: Date.now() + longLived.expires_in * 1000,
        refreshTokenExpiresIn: Date.now() + 2 * 30 * 24 * 60 * 60 * 1000,
        profileId: user.id,
        username: user.username,
        fullName: user.name,
        profileImage: user.threads_profile_picture_url,
      } as const;
      const result = await ctx.upsert(connection);

      if (result.status === "transfer_required") {
        return transferRequiredRedirect({ platform: "threads", ...result });
      }

      ctx.onConnected?.({ provider: "threads", username: user.username });
      return callbackRedirect("/socials?success=true&provider=threads");
    } catch (err) {
      console.error("Threads callback error:", err);
      return callbackRedirect(
        "/socials?error=server_error&code=THREADS_500&provider=threads"
      );
    }
  },
};
