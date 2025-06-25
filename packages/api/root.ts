import { postRouter } from './router/posts';
import { socialProviderRouter } from './router/social-provider';
import { createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({
  socialProvider: socialProviderRouter,
  post: postRouter,
});

export type AppRouter = typeof appRouter;
