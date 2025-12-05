import { clerkMiddleware, createRouteMatcher } from '@delulu/auth/server';
import {
  noseconeMiddleware,
  noseconeOptions,
} from '@delulu/security/middleware';
import { NextResponse } from 'next/server';

const publicRoutes = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/verify-email(.*)',
  '/api/trpc(.*)',
  '/api/transcribe(.*)',
]);

const authRoutes = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/verify-email(.*)',
]);

const onboardingRoute = createRouteMatcher(['/onboarding(.*)']);

// Create security headers middleware
// const securityHeaders = noseconeMiddleware(noseconeOptions);

export default clerkMiddleware(async (auth, req) => {
  // Get the security headers
  // await securityHeaders();

  // Get auth state
  const { userId, redirectToSignIn, sessionClaims } = await auth();

  console.log('userId', userId);

  // Allow access to public routes regardless of auth status
  if (publicRoutes(req)) {
    return NextResponse.next();
  }

  // If the user isn't signed in and the route is private, redirect to sign-in
  if (!userId && !publicRoutes(req)) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // For authenticated users visiting /onboarding, allow access
  if (userId && onboardingRoute(req)) {
    return NextResponse.next();
  }

  // Redirect logged-in users away from auth routes
  if (userId && authRoutes(req)) {
    console.log('redirecting to home');
    const homeUrl = new URL('/', req.nextUrl.origin);
    return NextResponse.redirect(homeUrl);
  }

  // Check if authenticated user has completed onboarding
  // If not, redirect to /onboarding
  const metadata = sessionClaims?.metadata as
    | { onboardingComplete?: boolean }
    | undefined;
  if (userId && !metadata?.onboardingComplete) {
    const onboardingUrl = new URL('/onboarding', req.url);
    return NextResponse.redirect(onboardingUrl);
  }

  // For all other routes, continue with security headers
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
