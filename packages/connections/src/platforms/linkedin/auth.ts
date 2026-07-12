import { api } from "@delulu/database/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import type {
  CallbackContext,
  ConnectContext,
  PlatformAuth,
} from "../../types";
import { LINKEDIN_VERSION } from "./constants";

/**
 * OAuth scopes for LinkedIn — mirrors the connect-url service LINKEDIN block.
 * No `offline.access`/refresh scope, so there is no token-refresh flow.
 */
const SCOPES = [
  "r_basicprofile",
  "r_member_postAnalytics",
  "w_member_social",
  "w_organization_social",
];

const redirect = (location: string): Response =>
  new Response(null, { status: 302, headers: { Location: location } });

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
 * Sanitizes and creates a safe username fragment from a name (ported verbatim
 * from the callback route).
 */
function sanitizeText(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "")
    .replace(/\s+/g, "")
    .slice(0, 20);
}

/**
 * Generates a username from first and last names with fallback strategies
 * (ported verbatim from the callback route).
 */
function generateUniqueUsername(firstName: string, lastName: string): string {
  const sanitizedFirst = sanitizeText(firstName);
  const sanitizedLast = sanitizeText(lastName);

  if (sanitizedFirst && sanitizedLast) {
    return `${sanitizedFirst}.${sanitizedLast}`;
  }
  if (sanitizedFirst) {
    return sanitizedFirst;
  }
  if (sanitizedLast) {
    return sanitizedLast;
  }
  return "user";
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
   * OAuth callback. The thin Next.js route resolves Clerk auth + Convex token
   * and passes them in via `CallbackContext`; code exchange, profile fetch, and
   * upsert live here. Returns redirect Responses preserving the old route's
   * exact Location paths and error codes.
   */
  async handleCallback(ctx: CallbackContext): Promise<Response> {
    const { code, convexToken } = ctx;
    const clientId = process.env.LINKEDIN_CLIENT_ID ?? "";
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET ?? "";
    const callbackUrl = process.env.LINKEDIN_CALLBACK_URL ?? "";

    if (!code) {
      return redirect(
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

      const { access_token, expires_in } =
        (await tokenResponse.json()) as LinkedInResponse;

      // 2. Fetch the user profile.
      const userResponse = await fetch(
        "https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "X-Restli-Protocol-Version": "2.0.0",
            "LinkedIn-Version": LINKEDIN_VERSION,
          },
        }
      );

      if (!userResponse.ok) {
        throw new Error("linkedin_user_fetch_failed");
      }

      const userObject = (await userResponse.json()) as LinkedInUserResponse;

      const username = generateUniqueUsername(
        userObject.localizedFirstName,
        userObject.localizedLastName
      );

      const profileImage =
        userObject.profilePicture?.["displayImage~"]?.elements[0]
          ?.identifiers[0]?.identifier;

      // 3. Upsert social provider (per-call client carrying the user's token).
      const connection = {
        socialType: "LINKEDIN",
        accessToken: access_token,
        expiresIn: Date.now() + expires_in * 1000,
        refreshTokenExpiresIn: Date.now() + 2 * 30 * 24 * 60 * 60 * 1000,
        profileId: userObject.id,
        username,
        fullName: `${userObject.localizedFirstName} ${userObject.localizedLastName}`,
        profileImage: profileImage ?? "/images/user.png",
      } as const;
      let status: string;
      if (ctx.upsert) {
        status = await ctx.upsert(connection);
      } else {
        const convex = new ConvexHttpClient(
          process.env.NEXT_PUBLIC_CONVEX_URL ?? ""
        );
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
          "/socials?notification=account_transferred&platform=linkedin"
        );
      }

      ctx.onConnected?.({ provider: "linkedin", username });
      return redirect("/socials");
    } catch (error) {
      console.error("LinkedIn callback error:", error);
      const errorType =
        error instanceof Error ? error.message : "internal_error";
      return redirect(
        `/socials?error=${errorType}&code=LINKEDIN_ERR&provider=LINKEDIN`
      );
    }
  },
};
