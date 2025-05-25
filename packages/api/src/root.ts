import { createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({
  // Add your sub-routers here
});

// export type definition of API
export type AppRouter = typeof appRouter;
