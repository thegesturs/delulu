import { SOCIAL_ACCOUNT_CONNECTED } from "@delulu/analytics/events";
import { analytics } from "@delulu/analytics/posthog/server";
import { auth } from "@delulu/auth/server";
import { api } from "@delulu/database/convex/_generated/api";
import { fetchMutation } from "@delulu/database/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "@/env";

interface TikTokResponse {
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

// Helper function to fetch with timeout
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout = 5000
) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
};

export async function GET(request: NextRequest) {
  console.log("tiktok callback");
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.redirect(
        new URL(
          "/socials?error=auth_required&code=AUTH_001&provider=TIKTOK",
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
            "/socials?error=auth_required&code=AUTH_001&provider=tiktok",
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    console.log("code", code);
    console.log("state", state);

    if (!(state && code)) {
      return NextResponse.redirect(
        new URL(
          "/socials?error=invalid_request&code=PARAM_001&provider=TIKTOK",
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetchWithTimeout(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Cache-Control": "no-cache",
        },
        body: new URLSearchParams({
          client_key: env.TIKTOK_CLIENT_ID,
          client_secret: env.TIKTOK_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: env.TIKTOK_CALLBACK_URL,
        }),
      }
    ).catch((error) => {
      console.error("TikTok token fetch error:", error);
      throw new Error("tiktok_auth_failed");
    });

    console.log("tokenResponse", tokenResponse);

    if (!tokenResponse.ok) {
      throw new Error("tiktok_token_invalid");
    }

    const response: TikTokResponse = await tokenResponse.json();
    const { access_token, refresh_token, expires_in, open_id } = response;

    // Get TikTok user data
    const userResponse = await fetchWithTimeout(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,username",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!userResponse.ok) {
      console.error("TikTok user fetch error:", await userResponse.text());
      throw new Error("tiktok_user_fetch_failed");
    }

    const userData = (await userResponse.json()) as TikTokUserResponse;
    if (!userData.data?.user) {
      console.error("Invalid user data response:", userData);
      throw new Error("tiktok_invalid_user_data");
    }

    const { username, display_name, avatar_url } = userData.data.user;

    // Use Convex upsertSocialProvider to handle creation/update and potential account transfers
    const status = await fetchMutation(
      api.social_providers.upsertSocialProvider,
      {
        socialType: "TIKTOK",
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: Date.now() + expires_in * 1000,
        profileId: open_id,
        username,
        fullName: display_name,
        profileImage: avatar_url,
        isActive: true,
      },
      { token }
    );

    // Handle different response statuses
    if (status === "account_transferred") {
      return NextResponse.redirect(
        new URL(
          "/socials?notification=account_transferred&platform=tiktok",
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    analytics.capture({
      distinctId: userId,
      event: SOCIAL_ACCOUNT_CONNECTED,
      properties: {
        provider: "tiktok",
        username,
      },
    });

    return NextResponse.redirect(
      new URL("/socials?success=true&provider=TIKTOK", env.NEXT_PUBLIC_APP_URL)
    );
  } catch (error) {
    console.error("TikTok callback error:", error);
    return NextResponse.redirect(
      new URL(
        "/socials?error=auth_failed&code=AUTH_002&provider=TIKTOK",
        env.NEXT_PUBLIC_APP_URL
      )
    );
  }
}
