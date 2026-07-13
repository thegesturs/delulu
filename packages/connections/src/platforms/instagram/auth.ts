import { Effect } from "effect";
import { nanoid } from "nanoid";
import { callbackRedirect } from "../../callback-response";
import { env } from "../../env";
import type {
  CallbackContext,
  ConnectContext,
  PlatformAuth,
} from "../../types";
import { GRAPH_VERSION } from "./constants";
import { instagramWebhooks } from "./webhooks";

const BASE_SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
];

interface InstagramTokenResponse {
  access_token: string;
  user_id: string;
}
interface InstagramLongLivedTokenResponse {
  access_token: string;
  expires_in: number;
}
interface InstagramUserResponse {
  id: string;
  user_id: string;
  name: string;
  username: string;
  profile_picture_url: string;
}

const fetchTimeout = (url: string, init?: RequestInit, timeoutMs = 15_000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
};

export const instagramAuth: PlatformAuth = {
  scopes: BASE_SCOPES,
  isMultiStep: false,

  getConnectUrl(ctx?: ConnectContext): string {
    const scopes = [...BASE_SCOPES];
    if (ctx?.includeInsights) {
      scopes.push("instagram_business_manage_insights");
    }
    const params = new URLSearchParams({
      client_id: env().INSTAGRAM_CLIENT_ID,
      redirect_uri: env().INSTAGRAM_CALLBACK_URL,
      response_type: "code",
      scope: scopes.join(","),
      state: ctx?.state ?? nanoid(),
    });
    return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
  },

  /**
   * OAuth callback. The API verifies state and supplies persistence through
   * `CallbackContext`; everything else (code exchange,
   * long-lived token, profile fetch, upsert, webhook subscribe) lives here.
   * Returns redirect Responses matching the old route's error codes.
   */
  async handleCallback(ctx: CallbackContext): Promise<Response> {
    const { code, error, errorReason } = ctx;
    const e = env();

    if (error === "access_denied" && errorReason === "user_denied") {
      return callbackRedirect(
        "/socials?error=user_denied&code=INSTAGRAM_001&provider=instagram"
      );
    }
    if (!code) {
      return callbackRedirect(
        "/socials?error=invalid_request&code=PARAM_001&provider=instagram"
      );
    }

    try {
      // 1. Short-lived token
      const tokenResponse = await fetchTimeout(
        "https://api.instagram.com/oauth/access_token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: e.INSTAGRAM_CLIENT_ID,
            client_secret: e.INSTAGRAM_CLIENT_SECRET,
            grant_type: "authorization_code",
            redirect_uri: e.INSTAGRAM_CALLBACK_URL,
            code,
          }).toString(),
        }
      );
      if (!tokenResponse.ok) {
        return callbackRedirect(
          "/socials?error=token_invalid&code=INSTAGRAM_002&provider=instagram"
        );
      }
      const tokenData = (await tokenResponse.json()) as InstagramTokenResponse;

      // 2. Long-lived token
      const longLivedResponse = await fetchTimeout(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${e.INSTAGRAM_CLIENT_SECRET}&access_token=${tokenData.access_token}`
      );
      if (!longLivedResponse.ok) {
        return callbackRedirect(
          "/socials?error=token_invalid&code=INSTAGRAM_003&provider=instagram"
        );
      }
      const longLived =
        (await longLivedResponse.json()) as InstagramLongLivedTokenResponse;

      // 3. Profile (user_id is the IG business account id used in webhooks)
      const userResponse = await fetchTimeout(
        `https://graph.instagram.com/${GRAPH_VERSION}/me?fields=id,user_id,name,username,account_type,profile_picture_url&access_token=${longLived.access_token}`
      );
      if (!userResponse.ok) {
        return callbackRedirect(
          "/socials?error=user_fetch_failed&code=INSTAGRAM_004&provider=instagram"
        );
      }
      const user = (await userResponse.json()) as InstagramUserResponse;

      // 4. Upsert social provider (per-call client carrying the user's token)
      const connection = {
        socialType: "INSTAGRAM",
        accessToken: longLived.access_token,
        expiresIn: Date.now() + longLived.expires_in * 1000,
        refreshTokenExpiresIn: Date.now() + 2 * 30 * 24 * 60 * 60 * 1000,
        profileId: user.user_id,
        username: user.username,
        fullName: user.name || user.username || "Instagram User",
        profileImage: user.profile_picture_url,
      } as const;
      const status = await ctx.upsert(connection);

      // 5. Subscribe webhooks (best effort)
      await Effect.runPromise(
        instagramWebhooks.subscribe({
          profileId: user.user_id,
          accessToken: longLived.access_token,
        })
      );

      if (status === "transfer_required") {
        return callbackRedirect(
          "/socials?notification=account_transferred&platform=instagram"
        );
      }

      ctx.onConnected?.({ provider: "instagram", username: user.username });
      return callbackRedirect("/socials?success=true&provider=instagram");
    } catch (err) {
      console.error("Instagram callback error:", err);
      return callbackRedirect(
        "/socials?error=server_error&code=INSTAGRAM_500&provider=instagram"
      );
    }
  },
};
