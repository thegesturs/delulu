import { mediaRouter } from './router/media';
import { socialProviderRouter } from './router/social-provider';
import { createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({
  socialProvider: socialProviderRouter,
  media: mediaRouter,
});

export type AppRouter = typeof appRouter;
