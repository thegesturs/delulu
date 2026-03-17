import { keys } from "@delulu/api/keys";
import { analytics } from "@delulu/analytics/posthog/server";
import { SOCIAL_ACCOUNT_CONNECTED } from "@delulu/analytics/events";
import { auth } from "@delulu/auth/server";
import { api } from "@delulu/database/convex/_generated/api";
import { fetchMutation } from "@delulu/database/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "@/env";
import { fetchWithTimeout } from "@/lib/utils";

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
    statistics: {
      subscriberCount: string;
      videoCount: string;
      viewCount: string;
    };
  }>;
}

const REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/userinfo.profile",
];

function validatePermissions(grantedScope: string): boolean {
  const grantedScopes = grantedScope.split(" ");
  return REQUIRED_SCOPES.every((requiredScope) =>
    grantedScopes.includes(requiredScope)
  );
}

export async function GET(request: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.redirect(
        new URL(
          "/socials?error=auth_required&code=AUTH_001&provider=YOUTUBE",
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    const token = await getToken({ template: "convex" });
    if (!token) {
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            "/socials?error=auth_required&code=AUTH_001&provider=YOUTUBE",
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    // Handle user denying access
    if (error === "access_denied") {
      return NextResponse.redirect(
        new URL(
          "/socials?error=user_cancelled&code=YOUTUBE_001&provider=YOUTUBE",
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(
          "/socials?error=invalid_request&code=PARAM_001&provider=YOUTUBE",
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    // Exchange code for access token
    const tokenUrl = "https://oauth2.googleapis.com/token";
    const tokenParams = new URLSearchParams({
      client_id: keys().GOOGLE_CLIENT_ID,
      client_secret: keys().GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: keys().YOUTUBE_CALLBACK_URL,
    });

    const tokenResponse = await fetchWithTimeout(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      console.error(
        "YouTube token exchange failed:",
        await tokenResponse.text()
      );
      return NextResponse.redirect(
        new URL(
          "/socials?error=youtube_auth_failed&code=YOUTUBE_002&provider=YOUTUBE",
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;

    // Check if user granted all required permissions
    if (!validatePermissions(tokenData.scope)) {
      return NextResponse.redirect(
        new URL(
          "/socials?error=youtube_insufficient_permissions&code=YOUTUBE_003&provider=YOUTUBE",
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    // Get YouTube channel information
    const channelResponse = await fetchWithTimeout(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!channelResponse.ok) {
      return NextResponse.redirect(
        new URL(
          "/socials?error=youtube_user_fetch_failed&code=YOUTUBE_005&provider=YOUTUBE",
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    const channelData =
      (await channelResponse.json()) as YouTubeChannelResponse;

    // Check if user has a YouTube channel
    if (!channelData.items || channelData.items.length === 0) {
      return NextResponse.redirect(
        new URL(
          "/socials?error=youtube_no_channel&code=YOUTUBE_006&provider=YOUTUBE",
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    const channel = channelData.items[0];
    const channelUsername =
      channel.snippet.customUrl ||
      channel.snippet.title.replace(/\s+/g, "").toLowerCase();

    // Store the YouTube connection using Convex
    const status = await fetchMutation(
      api.social_providers.upsertSocialProvider,
      {
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
        isActive: true,
      },
      { token }
    );

    // Handle different response statuses
    if (status === "account_transferred") {
      return NextResponse.redirect(
        new URL(
          "/socials?notification=account_transferred&platform=youtube",
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    analytics.capture({
      distinctId: userId,
      event: SOCIAL_ACCOUNT_CONNECTED,
      properties: {
        provider: "youtube",
        username: channelUsername,
      },
    });

    return NextResponse.redirect(new URL("/socials", env.NEXT_PUBLIC_APP_URL));
  } catch (error) {
    console.error("YouTube callback error:", error);
    return NextResponse.redirect(
      new URL(
        "/socials?error=internal_error&code=YOUTUBE_500&provider=YOUTUBE",
        env.NEXT_PUBLIC_APP_URL
      )
    );
  }
}

export const POST = GET;
export const PUT = GET;
