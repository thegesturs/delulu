import { socialProviderRouter } from './router/social-provider';
import { createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({
  // Add your sub-routers here
  socialProvider: socialProviderRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
