import { Effect } from "effect";
import { nanoid } from "nanoid";
import { callbackRedirect } from "../../callback-response";
import { type ConnectionError, tokenExpired } from "../../errors";
import type {
  CallbackContext,
  ConnectContext,
  PlatformAuth,
  TokenRefreshResult,
} from "../../types";
import { SCOPES } from "./constants";

/**
 * Google/YouTube OAuth env. Read directly from `process.env` (connections
 * `env.ts` only carries Instagram keys and must not be edited here).
 */
const ytEnv = () => ({
  clientId: process.env.GOOGLE_CLIENT_ID ?? "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  callbackUrl: process.env.YOUTUBE_CALLBACK_URL ?? "",
});

const fetchTimeout = (url: string, init?: RequestInit, timeoutMs = 15_000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
};

const REQUIRED_SCOPES = SCOPES;

function validatePermissions(grantedScope: string): boolean {
  const grantedScopes = grantedScope.split(" ");
  return REQUIRED_SCOPES.every((requiredScope) =>
    grantedScopes.includes(requiredScope)
  );
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface YouTubeChannelResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      customUrl?: string;
      thumbnails: {
        default: { url: string };
        medium: { url: string };
        high: { url: string };
      };
    };
  }>;
}

export const youtubeAuth: PlatformAuth = {
  scopes: SCOPES,
  isMultiStep: false,

  getConnectUrl(ctx?: ConnectContext): string {
    const e = ytEnv();
    const params = new URLSearchParams({
      client_id: e.clientId,
      redirect_uri: e.callbackUrl,
      response_type: "code",
      scope: SCOPES.join(" "),
      access_type: "offline",
      prompt: "consent",
      state: ctx?.state ?? nanoid(),
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  /**
   * OAuth callback. Ported from `app/api/callback/youtube/route.ts`. The thin
   * The API verifies state and supplies persistence through `CallbackContext`;
   * everything else (code exchange, scope validation, channel
   * fetch, upsert) lives here. Redirect Locations + error codes are preserved
   * byte-for-byte from the old route.
   */
  async handleCallback(ctx: CallbackContext): Promise<Response> {
    const { code, error } = ctx;
    const e = ytEnv();

    // Handle user denying access
    if (error === "access_denied") {
      return callbackRedirect(
        "/socials?error=user_cancelled&code=YOUTUBE_001&provider=YOUTUBE"
      );
    }

    if (!code) {
      return callbackRedirect(
        "/socials?error=invalid_request&code=PARAM_001&provider=YOUTUBE"
      );
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetchTimeout(
        "https://oauth2.googleapis.com/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: e.clientId,
            client_secret: e.clientSecret,
            code,
            grant_type: "authorization_code",
            redirect_uri: e.callbackUrl,
          }).toString(),
        }
      );

      if (!tokenResponse.ok) {
        console.error(
          "YouTube token exchange failed:",
          await tokenResponse.text()
        );
        return callbackRedirect(
          "/socials?error=youtube_auth_failed&code=YOUTUBE_002&provider=YOUTUBE"
        );
      }

      const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;

      // Check if user granted all required permissions
      if (!validatePermissions(tokenData.scope)) {
        return callbackRedirect(
          "/socials?error=youtube_insufficient_permissions&code=YOUTUBE_003&provider=YOUTUBE"
        );
      }

      // Get YouTube channel information
      const channelResponse = await fetchTimeout(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
      );

      if (!channelResponse.ok) {
        return callbackRedirect(
          "/socials?error=youtube_user_fetch_failed&code=YOUTUBE_005&provider=YOUTUBE"
        );
      }

      const channelData =
        (await channelResponse.json()) as YouTubeChannelResponse;

      // Check if user has a YouTube channel
      if (!channelData.items || channelData.items.length === 0) {
        return callbackRedirect(
          "/socials?error=youtube_no_channel&code=YOUTUBE_006&provider=YOUTUBE"
        );
      }

      const channel = channelData.items[0];
      const channelUsername =
        channel.snippet.customUrl ||
        channel.snippet.title.replace(/\s+/g, "").toLowerCase();

      // Store the YouTube connection (per-call client carrying the user's token)
      const connection = {
        socialType: "YOUTUBE",
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || "",
        expiresIn: Date.now() + tokenData.expires_in * 1000,
        profileId: channel.id,
        username: channelUsername,
        fullName: channel.snippet.title,
        profileImage:
          channel.snippet.thumbnails?.high?.url ||
          channel.snippet.thumbnails?.medium?.url ||
          channel.snippet.thumbnails?.default?.url ||
          "",
      } as const;
      const status = await ctx.upsert(connection);

      // Handle different response statuses
      if (status === "transfer_required") {
        return callbackRedirect(
          "/socials?notification=account_transferred&platform=youtube"
        );
      }

      ctx.onConnected?.({ provider: "youtube", username: channelUsername });
      return callbackRedirect("/socials");
    } catch (err) {
      console.error("YouTube callback error:", err);
      return callbackRedirect(
        "/socials?error=internal_error&code=YOUTUBE_500&provider=YOUTUBE"
      );
    }
  },

  refreshToken({
    refreshToken,
  }): Effect.Effect<TokenRefreshResult, ConnectionError> {
    const e = ytEnv();
    return Effect.gen(function* () {
      const data = yield* Effect.tryPromise({
        try: () =>
          fetchTimeout("https://oauth2.googleapis.com/token", {
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
              throw new Error(`YouTube refresh failed: ${r.status}`);
            }
            return r.json() as Promise<{
              access_token: string;
              refresh_token?: string;
              expires_in?: number;
            }>;
          }),
        catch: () => tokenExpired("YouTube", "refresh failed"),
      });
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: Date.now() + (data.expires_in ?? 3600) * 1000,
      };
    });
  },
};
