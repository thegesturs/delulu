import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import { fetchMutation, fetchQuery } from "@delulu/database/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const analyticsRouter = createTRPCRouter({
  /**
   * Get account overview with daily insights + summary cards.
   * Returns cached data + staleness flag.
   */
  getAccountOverview: protectedProcedure
    .input(
      z.object({
        socialProviderId: z.string(),
        days: z.number().min(1).max(90).optional().default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      return fetchQuery(
        api.analytics.getAccountOverview,
        {
          socialProviderId: input.socialProviderId as Id<"socialProviders">,
          days: input.days,
        },
        { token: ctx.token }
      );
    }),

  /**
   * Get top performing posts for a social provider.
   */
  getTopPosts: protectedProcedure
    .input(
      z.object({
        socialProviderId: z.string(),
        sortBy: z
          .enum(["views", "likes", "comments", "engagement", "shares"])
          .optional()
          .default("views"),
        limit: z.number().min(1).max(50).optional().default(25),
      })
    )
    .query(async ({ ctx, input }) => {
      return fetchQuery(
        api.analytics.getTopPosts,
        {
          socialProviderId: input.socialProviderId as Id<"socialProviders">,
          sortBy: input.sortBy,
          limit: input.limit,
        },
        { token: ctx.token }
      );
    }),

  /**
   * Get engagement timeline for a specific post (snapshots over time).
   */
  getMediaInsightsTimeline: protectedProcedure
    .input(
      z.object({
        socialProviderId: z.string(),
        platformPostId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return fetchQuery(
        api.analytics.getMediaInsightsTimeline,
        {
          socialProviderId: input.socialProviderId as Id<"socialProviders">,
          platformPostId: input.platformPostId,
        },
        { token: ctx.token }
      );
    }),

  /**
   * Get sync state for a social provider.
   */
  getSyncState: protectedProcedure
    .input(z.object({ socialProviderId: z.string() }))
    .query(async ({ ctx, input }) => {
      return fetchQuery(
        api.analytics.getSyncState,
        {
          socialProviderId: input.socialProviderId as Id<"socialProviders">,
        },
        { token: ctx.token }
      );
    }),

  /**
   * Trigger an analytics sync (manual refresh).
   */
  triggerSync: protectedProcedure
    .input(z.object({ socialProviderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return fetchMutation(
        api.analytics.triggerSync,
        {
          socialProviderId: input.socialProviderId as Id<"socialProviders">,
        },
        { token: ctx.token }
      );
    }),
});
