import {
  type NoseconeOptions,
  defaults as noseconeDefaults,
  withVercelToolbar,
} from '@nosecone/next';
export { createMiddleware as noseconeMiddleware } from '@nosecone/next';

// Nosecone security headers configuration
// https://docs.arcjet.com/nosecone/quick-start
export const noseconeOptions: NoseconeOptions = {
  ...noseconeDefaults,
  crossOriginEmbedderPolicy: {
    policy: 'unsafe-none',
  },
  contentSecurityPolicy: {
    ...noseconeDefaults.contentSecurityPolicy,
    directives: {
      ...noseconeDefaults.contentSecurityPolicy.directives,
      scriptSrc: [
        // We have to use unsafe-inline because next-themes and Vercel Analytics
        // do not support nonce
        // https://github.com/pacocoursey/next-themes/issues/106
        //...noseconeDefaults.contentSecurityPolicy.directives.scriptSrc,
        "'self'",
        "'unsafe-inline'",
        'https://www.googletagmanager.com',
      ],
      connectSrc: [
        ...noseconeDefaults.contentSecurityPolicy.directives.connectSrc,
        'https://*.google-analytics.com',
        'https://delulu-social.40dd16663d44dc635537be6d183af841.r2.cloudflarestorage.com',
        'https://*.convex.cloud',
        'wss://*.convex.cloud',
      ],
      workerSrc: [
        ...noseconeDefaults.contentSecurityPolicy.directives.workerSrc,
        'blob:',
      ],
      imgSrc: [
        ...noseconeDefaults.contentSecurityPolicy.directives.imgSrc,
        'https://media.delulu.social',
        'https://delulu-social.40dd16663d44dc635537be6d183af841.r2.cloudflarestorage.com',
        // Google
        'https://lh3.googleusercontent.com',
        // LinkedIn
        'https://media.licdn.com',
        // GitHub
        'https://avatars.githubusercontent.com',
        // Instagram CDN - specific subdomain patterns
        'https://scontent.cdninstagram.com',
        'https://scontent-*.cdninstagram.com',
        // Facebook Graph API - restricted to specific endpoints
        'https://graph.facebook.com',
        // Facebook CDN - specific domains only
        'https://scontent.fna.fbcdn.net',
        'https://external.fna.fbcdn.net',
        // Farcaster
        'https://farcaster.xyz',
        // Threads - specific domains only
        'https://scontent.threads.net',
        'https://static.threads.net',
      ],
      mediaSrc: [
        ...noseconeDefaults.contentSecurityPolicy.directives.mediaSrc,
        'https://media.delulu.social',
        'https://delulu-social.40dd16663d44dc635537be6d183af841.r2.cloudflarestorage.com',
      ],
      objectSrc: [
        ...noseconeDefaults.contentSecurityPolicy.directives.objectSrc,
      ],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production',
    },
  },
};

export const noseconeOptionsWithToolbar: NoseconeOptions =
  withVercelToolbar(noseconeOptions);
