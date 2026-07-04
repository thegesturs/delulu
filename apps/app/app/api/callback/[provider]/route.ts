import { SOCIAL_ACCOUNT_CONNECTED } from "@delulu/analytics/events";
import { analytics } from "@delulu/analytics/posthog/server";
import { auth } from "@delulu/auth/server";
import { getConnection, type PublishableSocialType } from "@delulu/connections";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** URL slug → SocialType. Replaces the 9 hand-rolled per-platform routes. */
const PROVIDER_BY_SLUG: Record<string, PublishableSocialType> = {
  instagram: "INSTAGRAM",
  twitter: "TWITTER",
  linkedin: "LINKEDIN",
  tiktok: "TIKTOK",
  threads: "THREADS",
  facebook: "FACEBOOK",
  pinterest: "PINTEREST",
  youtube: "YOUTUBE",
  bluesky: "BLUESKY",
  farcaster: "FARCASTER",
};

const redirect = (location: string) =>
  new NextResponse(null, { status: 302, headers: { Location: location } });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const slug = provider?.toLowerCase();
  const socialType = PROVIDER_BY_SLUG[slug];

  if (!socialType) {
    return redirect(
      `/socials?error=invalid_request&code=PARAM_002&provider=${provider}`
    );
  }

  // OAuth callbacks need a Clerk session + Convex token; resolve here and hand
  // them to the connection (which stays Clerk/Next-free).
  const { userId, getToken } = await auth();
  if (!userId) {
    return redirect(
      `/socials?error=auth_required&code=AUTH_001&provider=${slug}`
    );
  }
  const token = await getToken({ template: "convex" });
  if (!token) {
    return redirect(
      `/socials?error=auth_required&code=AUTH_001&provider=${slug}`
    );
  }

  const searchParams = request.nextUrl.searchParams;
  return getConnection(socialType).auth.handleCallback({
    code: searchParams.get("code"),
    error: searchParams.get("error"),
    errorReason: searchParams.get("error_reason"),
    convexToken: token,
    userId,
    onConnected: ({ provider: connectedProvider, username }) => {
      analytics.capture({
        distinctId: userId,
        event: SOCIAL_ACCOUNT_CONNECTED,
        properties: { provider: connectedProvider, username },
      });
    },
  });
}
