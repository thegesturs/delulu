import { api } from "@delulu/database/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import type {
  CallbackContext,
  ConnectContext,
  PlatformAuth,
} from "../../types";
import { BLUESKY_HOST, CALLBACK_URL, CLIENT_METADATA_URL } from "./constants";

const redirect = (location: string): Response =>
  new Response(null, { status: 302, headers: { Location: location } });

const fetchTimeout = (url: string, init?: RequestInit, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
};

interface BlueskyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  refresh_token: string;
  did: string;
  handle: string;
}

interface BlueskyProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

export const blueskyAuth: PlatformAuth = {
  scopes: ["atproto", "transition:generic"],
  isMultiStep: false,

  getConnectUrl(ctx?: ConnectContext): string {
    // Bluesky OAuth URL — uses the client metadata URL as `client_id` per the
    // AT Protocol OAuth spec.
    const params = new URLSearchParams({
      client_id: CLIENT_METADATA_URL,
      redirect_uri: CALLBACK_URL,
      response_type: "code",
      scope: "atproto transition:generic",
      code_challenge_method: "S256",
      // code_challenge would be generated dynamically in a real implementation.
    });
    if (ctx?.state) {
      params.set("state", ctx.state);
    }
    return `${BLUESKY_HOST}/oauth/authorize?${params.toString()}`;
  },

  async handleCallback(ctx: CallbackContext): Promise<Response> {
    const { code, error, convexToken } = ctx;
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

    if (error === "access_denied") {
      return redirect(
        "/socials?error=user_denied&code=BLUESKY_001&provider=bluesky"
      );
    }
    if (!code) {
      return redirect(
        "/socials?error=invalid_request&code=PARAM_001&provider=bluesky"
      );
    }

    try {
      // Exchange authorization code for access token.
      const tokenResponse = await fetchTimeout(`${BLUESKY_HOST}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: CALLBACK_URL,
          client_id: CLIENT_METADATA_URL,
          // code_verifier would be stored from the initial OAuth request.
        }).toString(),
      });

      if (!tokenResponse.ok) {
        console.error(
          "Bluesky token exchange failed:",
          await tokenResponse.text()
        );
        return redirect(
          "/socials?error=token_invalid&code=BLUESKY_002&provider=bluesky"
        );
      }

      const tokenData = (await tokenResponse.json()) as BlueskyTokenResponse;

      // Get user profile information.
      const profileResponse = await fetchTimeout(
        `${BLUESKY_HOST}/xrpc/com.atproto.repo.describeRepo?repo=${tokenData.did}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        }
      );

      if (!profileResponse.ok) {
        console.error(
          "Bluesky profile fetch failed:",
          await profileResponse.text()
        );
        return redirect(
          "/socials?error=user_fetch_failed&code=BLUESKY_003&provider=bluesky"
        );
      }

      const profileData = (await profileResponse.json()) as BlueskyProfile;

      // Use Convex upsertSocialProvider to handle creation/update and potential
      // account transfers.
      const connection = {
        socialType: "BLUESKY",
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: Date.now() + 24 * 60 * 60 * 1000, // 24 hours default
        refreshTokenExpiresIn: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        profileId: tokenData.did,
        username: tokenData.handle,
        fullName: profileData.displayName || tokenData.handle,
        profileImage: profileData.avatar,
      } as const;
      let status: string;
      if (ctx.upsert) {
        status = await ctx.upsert(connection);
      } else {
        const convex = new ConvexHttpClient(convexUrl);
        convex.setAuth(convexToken);
        status = await convex.mutation(
          api.social_providers.upsertSocialProvider,
          {
            ...connection,
            isActive: true,
          }
        );
      }

      if (status === "account_transferred" || status === "transfer_required") {
        return redirect(
          "/socials?notification=account_transferred&platform=bluesky"
        );
      }

      ctx.onConnected?.({ provider: "bluesky", username: tokenData.handle });
      return redirect("/socials?success=true&provider=bluesky");
    } catch (err) {
      console.error("Bluesky callback error:", err);
      return redirect(
        "/socials?error=server_error&code=BLUESKY_500&provider=bluesky"
      );
    }
  },
};
