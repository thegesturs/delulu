import { clerkMiddleware } from '@clerk/nextjs/server';
import {
  noseconeMiddleware,
  noseconeOptions,
} from '@delulu/security/middleware';

// const securityHeaders = env.FLAGS_SECRET
//   ? noseconeMiddleware(noseconeOptionsWithToolbar)
//   : noseconeMiddleware(noseconeOptions);

const securityHeaders = noseconeMiddleware(noseconeOptions);

export default clerkMiddleware(() => {
  // Apply security headers
  const securityResponse = securityHeaders();
  
  // Let Clerk handle authentication automatically
  // Clerk will redirect unauthenticated users to sign-in
  
  return securityResponse;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
