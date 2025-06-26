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
        'https://*.clerk.accounts.dev',
        'https://va.vercel-scripts.com',
      ],
      connectSrc: [
        ...noseconeDefaults.contentSecurityPolicy.directives.connectSrc,
        'https://*.clerk.accounts.dev',
        'https://*.google-analytics.com',
        'https://clerk-telemetry.com',
        'https://delulu-social.40dd16663d44dc635537be6d183af841.r2.cloudflarestorage.com',
      ],
      workerSrc: [
        ...noseconeDefaults.contentSecurityPolicy.directives.workerSrc,
        'blob:',
        'https://*.clerk.accounts.dev',
      ],
      imgSrc: [
        ...noseconeDefaults.contentSecurityPolicy.directives.imgSrc,
        'https://img.clerk.com',
        'https://media.delulu.social',
        'https://delulu-social.40dd16663d44dc635537be6d183af841.r2.cloudflarestorage.com',
        'https://lh3.googleusercontent.com',
        'https://media.licdn.com',
        'https://avatars.githubusercontent.com',
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
