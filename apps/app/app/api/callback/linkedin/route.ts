import { analytics } from "@delulu/analytics/posthog/server";
import { SOCIAL_ACCOUNT_CONNECTED } from "@delulu/analytics/events";
import { auth } from "@delulu/auth/server";
import { api } from "@delulu/database/convex/_generated/api";
import { fetchMutation } from "@delulu/database/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "@/env";

interface LinkedInResponse {
  access_token: string;
  expires_in: number;
}

interface LinkedInUserResponse {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture?: {
    "displayImage~": {
      elements: Array<{
        identifiers: Array<{
          identifier: string;
        }>;
      }>;
    };
  };
}

/**
 * Sanitizes and creates a safe username from first and last names
 */
function sanitizeText(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  return (
    text
      .toLowerCase()
      .trim()
      // Remove or replace special characters and spaces
      .replace(/[^a-z0-9]/g, "")
      // Remove consecutive spaces that became empty
      .replace(/\s+/g, "")
      // Limit length to prevent overly long usernames
      .substring(0, 20)
  );
}

/**
 * Generates a unique username from first and last names with fallback strategies
 */
function generateUniqueUsername(firstName: string, lastName: string): string {
  // Validate and sanitize inputs
  const sanitizedFirst = sanitizeText(firstName);
  const sanitizedLast = sanitizeText(lastName);

  // Strategy 1: Use first.last format if both names are valid
  if (sanitizedFirst && sanitizedLast) {
    const baseUsername = `${sanitizedFirst}.${sanitizedLast}`;
    return baseUsername;
  }

  // Strategy 2: Use just first name if available
  if (sanitizedFirst) {
    const baseUsername = sanitizedFirst;
    return baseUsername;
  }

  // Strategy 3: Use just last name if available
  if (sanitizedLast) {
    const baseUsername = sanitizedLast;
    return baseUsername;
  }
  return "user";
}

export async function GET(request: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.redirect(
        new URL(
          "/socials?error=auth_required&code=AUTH_001&provider=LINKEDIN",
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }
    const token = await getToken({ template: "convex" });

    if (!token) {
      return NextResponse.redirect(
        new URL(
          "/socials?error=auth_required&code=AUTH_001&provider=LINKEDIN",
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(
        new URL(
          "/socials?error=invalid_request&code=PARAM_001&provider=LINKEDIN",
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    // Get LinkedIn access token
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
          redirect_uri: env.LINKEDIN_CALLBACK_URL,
          client_id: env.LINKEDIN_CLIENT_ID,
          client_secret: env.LINKEDIN_CLIENT_SECRET,
        }),
      }
    ).catch((error) => {
      console.error("LinkedIn token fetch error:", error);
      throw new Error("linkedin_auth_failed");
    });

    if (!tokenResponse.ok) {
      throw new Error("linkedin_token_invalid");
    }

    const { access_token, expires_in } =
      (await tokenResponse.json()) as LinkedInResponse;

    // Get LinkedIn user profile
    const userResponse = await fetch(
      "https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "X-Restli-Protocol-Version": "2.0.0",
          "LinkedIn-Version": "202507",
        },
      }
    );

    if (!userResponse.ok) {
      throw new Error("linkedin_user_fetch_failed");
    }

    const userObject = (await userResponse.json()) as LinkedInUserResponse;

    // Generate a safe and unique username
    const username = generateUniqueUsername(
      userObject.localizedFirstName,
      userObject.localizedLastName
    );

    // Get profile image URL from the complex response structure
    const profileImage =
      userObject.profilePicture?.["displayImage~"]?.elements[0]?.identifiers[0]
        ?.identifier;

    // Use Convex upsertSocialProvider to handle creation/update and potential account transfers
    const status = await fetchMutation(
      api.social_providers.upsertSocialProvider,
      {
        socialType: "LINKEDIN",
        accessToken: access_token,
        expiresIn: Date.now() + expires_in * 1000,
        refreshTokenExpiresIn: Date.now() + 2 * 30 * 24 * 60 * 60 * 1000,
        profileId: userObject.id,
        username,
        fullName: `${userObject.localizedFirstName} ${userObject.localizedLastName}`,
        profileImage: profileImage ?? "/images/user.png",
        isActive: true,
      },
      { token }
    );

    // Handle different response statuses
    if (status === "account_transferred") {
      return NextResponse.redirect(
        new URL(
          "/socials?notification=account_transferred&platform=linkedin",
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    analytics.capture({
      distinctId: userId,
      event: SOCIAL_ACCOUNT_CONNECTED,
      properties: {
        provider: "linkedin",
        username,
      },
    });

    return NextResponse.redirect(new URL("/socials", env.NEXT_PUBLIC_APP_URL));
  } catch (error) {
    console.error("LinkedIn callback error:", error);
    const errorType = error instanceof Error ? error.message : "internal_error";
    return NextResponse.redirect(
      new URL(
        `/socials?error=${errorType}&code=LINKEDIN_ERR&provider=LINKEDIN`,
        env.NEXT_PUBLIC_APP_URL
      )
    );
  }
}

export const POST = GET;
export const PUT = GET;
