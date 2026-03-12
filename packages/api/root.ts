import { z } from "zod";
import { affiliateRouter } from "./router/affiliate";
import { mediaRouter } from "./router/media";
import { socialProviderRouter } from "./router/social-provider";
import { createTRPCRouter, publicProcedure } from "./trpc";

export const appRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string().optional() }).optional())
    .query(({ input }) => {
      return {
        greeting: `Hello ${input?.text ?? "world"}`,
      };
    }),
  affiliate: affiliateRouter,
  socialProvider: socialProviderRouter,
  media: mediaRouter,
});

export type AppRouter = typeof appRouter;
