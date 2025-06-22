import { authMiddleware } from '@delulu/auth/middleware';
import { internationalizationMiddleware } from '@delulu/internationalization/middleware';
import type { NextMiddleware, NextRequest } from 'next/server';

export const config = {
  // matcher tells Next.js which routes to run the middleware on. This runs the
  // middleware on all routes except for static assets, SEO files, and Posthog ingest
  matcher: [
    '/((?!_next/static|_next/image|ingest|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};

const middleware = authMiddleware((_auth, request) => {
  const i18nResponse = internationalizationMiddleware(
    request as unknown as NextRequest
  );
  if (i18nResponse) {
    return i18nResponse;
  }
  return;
}) as unknown as NextMiddleware;

export default middleware;
