import { clerkMiddleware, createRouteMatcher } from "@delulu/auth/server";
import {
  noseconeMiddleware,
  noseconeOptions,
} from "@delulu/security/middleware";
import { NextResponse } from "next/server";

const publicRoutes = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/verify-email(.*)",
  "/api/callback(.*)",
  "/api/transcribe(.*)",
  "/extension-auth-success(.*)",
  "/mcp(.*)",
  "/.well-known(.*)",
]);

const authRoutes = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/verify-email(.*)",
]);

const onboardingRoute = createRouteMatcher(["/onboarding(.*)"]);
/** Allow automation builder during onboarding (step 3) */
const onboardingAutomationRoute = createRouteMatcher(["/automations(.*)"]);

// Create security headers middleware
const securityHeaders = noseconeMiddleware(noseconeOptions);

export default clerkMiddleware(async (auth, req) => {
  // Get the security headers
  await securityHeaders();

  // Geo-detection: read Cloudflare country header and set cookie
  const country = req.headers.get("cf-ipcountry") || "US";
  const withGeoCookie = (response: NextResponse) => {
    response.cookies.set("x-geo-country", country, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 86_400,
    });
    return response;
  };

  // Get auth state
  const { userId, redirectToSignIn, sessionClaims } = await auth();

  console.log("userId", userId, req.url);

  // Allow access to public routes regardless of auth status
  if (publicRoutes(req)) {
    return withGeoCookie(NextResponse.next());
  }

  // If the user isn't signed in and the route is private, redirect to sign-in
  if (!(userId || publicRoutes(req))) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // For authenticated users visiting /onboarding or setting up automations, allow access
  if (userId && (onboardingRoute(req) || onboardingAutomationRoute(req))) {
    return withGeoCookie(NextResponse.next());
  }

  // Redirect logged-in users away from auth routes
  if (userId && authRoutes(req)) {
    const homeUrl = new URL("/", req.nextUrl.origin);
    return withGeoCookie(NextResponse.redirect(homeUrl));
  }

  // Check if authenticated user has completed onboarding
  // If not, redirect to /onboarding
  const metadata = sessionClaims?.metadata as
    | { onboardingComplete?: boolean }
    | undefined;
  if (userId && !metadata?.onboardingComplete) {
    const onboardingUrl = new URL("/onboarding", req.url);
    return withGeoCookie(NextResponse.redirect(onboardingUrl));
  }

  console.log("continuing with security headers");

  // For all other routes, continue with security headers
  return withGeoCookie(NextResponse.next());
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
