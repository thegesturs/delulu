import { mediaRouter } from './router/media';
import { postRouter } from './router/posts';
import { socialProviderRouter } from './router/social-provider';
import { createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({
  socialProvider: socialProviderRouter,
  post: postRouter,
  media: mediaRouter,
});

export type AppRouter = typeof appRouter;
