import { authMiddleware } from '@delulu/auth/middleware';
import { internationalizationMiddleware } from '@delulu/internationalization/middleware';
import { parseError } from '@delulu/observability/error';
import { secure } from '@delulu/security';
import {
  noseconeMiddleware,
  noseconeOptions,
} from '@delulu/security/middleware';
import {
  type NextMiddleware,
  type NextRequest,
  NextResponse,
} from 'next/server';

export const config = {
  // matcher tells Next.js which routes to run the middleware on. This runs the
  // middleware on all routes except for static assets, SEO files, and Posthog ingest
  matcher: ['/((?!_next/static|_next/image|ingest|favicon.ico|robots.txt|sitemap.xml).*)'],
};

const securityHeaders = noseconeMiddleware(noseconeOptions);

const middleware = authMiddleware(async (_auth, request) => {
  const i18nResponse = internationalizationMiddleware(
    request as unknown as NextRequest
  );
  if (i18nResponse) {
    return i18nResponse;
  }

  try {
    await secure(
      [
        // See https://docs.arcjet.com/bot-protection/identifying-bots
        'CATEGORY:SEARCH_ENGINE', // Allow search engines
        'CATEGORY:PREVIEW', // Allow preview links to show OG images
        'CATEGORY:MONITOR', // Allow uptime monitoring services
      ],
      request
    );

    return securityHeaders();
  } catch (error) {
    const message = parseError(error);

    return NextResponse.json({ error: message }, { status: 403 });
  }
}) as unknown as NextMiddleware;

export default middleware;
