import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
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

// Create security headers middleware
const securityHeaders = noseconeMiddleware(noseconeOptions);

export default clerkMiddleware(async (auth, req) => {
  // Get the security headers
  await securityHeaders();

  // Get auth state
  const { userId, redirectToSignIn } = await auth();

  // Allow access to public routes regardless of auth status
  if (publicRoutes(req)) {
    return NextResponse.next();
  }

  // If the user isn't signed in and the route is private, redirect to sign-in
  if (!userId && !publicRoutes(req)) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // Redirect logged-in users away from auth routes
  if (userId && authRoutes(req)) {
    const homeUrl = new URL('/', req.nextUrl.origin);
    return NextResponse.redirect(homeUrl);
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
