import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import { fetchMutation, fetchQuery } from "@delulu/database/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  refreshInstagramToken,
  syncInstagramInsights,
} from "../services/instagram-insights.service";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const MANUAL_REFRESH_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
const STALE_SYNCING_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

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
   * Trigger an analytics sync — fetches from Instagram API and stores in Convex.
   * All API calls happen here in tRPC (Cloudflare Workers), not in Convex actions.
   */
  triggerSync: protectedProcedure
    .input(z.object({ socialProviderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const socialProviderId = input.socialProviderId as Id<"socialProviders">;

      // Get provider with decrypted tokens
      const provider = await fetchQuery(
        api.social_providers.getSocialProviderWithDecryptedTokens,
        { id: socialProviderId },
        { token: ctx.token }
      );

      if (!(provider?.accessToken && provider.profileId)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Instagram account not found or access token missing",
        });
      }

      if (provider.socialType !== "INSTAGRAM") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Analytics sync not yet supported for ${provider.socialType}`,
        });
      }

      // Check sync state — enforce cooldown and prevent duplicate syncs
      const syncState = await fetchQuery(
        api.analytics.getSyncState,
        { socialProviderId },
        { token: ctx.token }
      );

      const now = Date.now();

      if (syncState?.syncStatus === "SYNCING") {
        if (
          syncState.updatedAt &&
          now - syncState.updatedAt < STALE_SYNCING_THRESHOLD_MS
        ) {
          return { status: "ALREADY_SYNCING" as const };
        }
      }

      if (
        syncState?.lastAccountInsightsFetchedAt &&
        now - syncState.lastAccountInsightsFetchedAt <
          MANUAL_REFRESH_COOLDOWN_MS
      ) {
        return { status: "COOLDOWN" as const };
      }

      // Set sync state to SYNCING
      await fetchMutation(
        api.analytics.updateSyncState,
        {
          socialProviderId,
          syncStatus: "SYNCING" as const,
          lastSyncError: undefined,
        },
        { token: ctx.token }
      );

      try {
        // Check if token needs refresh (within 7 days of expiry)
        const tokenExpiresAt = provider.updatedAt + provider.expiresIn * 1000;
        if (tokenExpiresAt - now < 7 * 24 * 60 * 60 * 1000) {
          await refreshInstagramToken(
            socialProviderId,
            provider.accessToken,
            ctx.token
          );
        }

        // Run the sync — all Instagram API calls happen here
        await syncInstagramInsights({
          socialProviderId,
          profileId: provider.profileId,
          accessToken: provider.accessToken,
          userId: provider.userId ?? undefined,
          organizationId: provider.organizationId ?? undefined,
          token: ctx.token,
        });

        // Update sync state to success
        await fetchMutation(
          api.analytics.updateSyncState,
          {
            socialProviderId,
            syncStatus: "IDLE" as const,
            lastAccountInsightsFetchedAt: now,
            lastMediaInsightsFetchedAt: now,
            lastSyncError: undefined,
          },
          { token: ctx.token }
        );

        return { status: "COMPLETED" as const };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        let syncStatus: "TOKEN_EXPIRED" | "RATE_LIMITED" | "ERROR" = "ERROR";
        if (
          errorMessage.includes("OAuthException") ||
          errorMessage.includes("190")
        ) {
          syncStatus = "TOKEN_EXPIRED";
        } else if (
          errorMessage.includes("429") ||
          errorMessage.includes("rate")
        ) {
          syncStatus = "RATE_LIMITED";
        }

        await fetchMutation(
          api.analytics.updateSyncState,
          {
            socialProviderId,
            syncStatus,
            lastSyncError: errorMessage,
            ...(syncStatus === "RATE_LIMITED"
              ? { rateLimitResetAt: now + 60 * 60 * 1000 }
              : {}),
          },
          { token: ctx.token }
        );

        return { status: syncStatus };
      }
    }),
});
