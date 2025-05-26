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
  contentSecurityPolicy: {
    ...noseconeDefaults.contentSecurityPolicy,
    directives: {
      ...noseconeDefaults.contentSecurityPolicy.directives,
      scriptSrc: [
        // We have to use unsafe-inline because next-themes and Vercel Analytics
        // do not support nonce
        // https://github.com/pacocoursey/next-themes/issues/106
        // https://github.com/vercel/analytics/issues/122
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
      ],
      workerSrc: [
        ...noseconeDefaults.contentSecurityPolicy.directives.workerSrc,
        'blob:',
        'https://*.clerk.accounts.dev',
      ],
      imgSrc: [
        ...noseconeDefaults.contentSecurityPolicy.directives.imgSrc,
        'https://img.clerk.com',
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
