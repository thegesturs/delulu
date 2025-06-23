import { getSessionCookie } from '@delulu/auth/server';
import {
  noseconeMiddleware,
  noseconeOptions,
  noseconeOptionsWithToolbar,
} from '@delulu/security/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { env } from './env';

const securityHeaders = env.FLAGS_SECRET
  ? noseconeMiddleware(noseconeOptionsWithToolbar)
  : noseconeMiddleware(noseconeOptions);

// Helper function to check if route is public
function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/sign-in',
    '/sign-up',
    '/api/auth',
    '/api/trpc',
    '/api/webhooks',
  ];

  return publicRoutes.some((route) => pathname.startsWith(route));
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply security headers
  const securityResponse = securityHeaders();

  // Skip auth check for public routes
  if (isPublicRoute(pathname)) {
    return securityResponse || NextResponse.next();
  }

  // Check for session cookie using Better Auth's recommended approach
  const sessionCookie = getSessionCookie(request);

  // Redirect to sign-in if no session cookie found
  if (!sessionCookie) {
    const signInUrl = new URL('/sign-in', request.url);
    // Add the current path as redirect_to query param
    signInUrl.searchParams.set('redirect_to', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return securityResponse || NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
