import { keys } from "@api/keys";
import { createPostInQueue } from "@api/services/post.service";
import { getCloudflareEnv } from "@delulu/cloudflare-types";
import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import { decryptData } from "@delulu/database/convex/utils";
import { fetchMutation, fetchQuery } from "@delulu/database/server";
import { log } from "@delulu/observability/log";
import {
  FacebookPageConnectionSchema,
  type FacebookPagesWithToken,
  FacebookPagesWithTokenSchema,
} from "@delulu/validators/facebook";
import { SocialTypeSchema } from "@delulu/validators/post";
import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { connectUrlRegistry } from "../services/connect-url.service";
import { protectedProcedure } from "../trpc";

export const socialProviderRouter = {
  getSocialProviderConnectUrl: protectedProcedure
    .input(
      z.object({
        provider: SocialTypeSchema.exclude(["DEFAULT", "LENS"]),
      })
    )
    .query(async ({ input, ctx }) => {
      // Check if user has reached their social account limit (single efficient query)
      const limitCheck = await fetchQuery(
        api.subscriptions.checkSocialAccountLimit,
        {},
        { token: ctx.token }
      );

      if (!limitCheck.allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `LIMIT_EXCEEDED: You have reached your ${limitCheck.planType} plan limit of ${limitCheck.limit} social accounts. Upgrade to connect more accounts.`,
        });
      }

      // Generate connect URL only if within limit
      const link = connectUrlRegistry[input.provider].connectUrl();
      return link;
    }),
  // createPost: protectedProcedure
  //   .input(savePostInputSchema)
  //   .mutation(async ({ input, ctx }) => {
  //     if (!input.id) {
  //       const savePostId = await fetchMutation(
  //         api.posts.createPost,
  //         {
  //           userId: ctx.userId,
  //           content: input.content,
  //           status: 'SAVED',
  //           socialProviderIds: input.socialProviders.map(
  //             (sp) => sp.socialId as Id<'socialProviders'>
  //           ),
  //           alternativeContent: input.alternativeContent.map((alt) => ({
  //             socialProviderId: alt.socialProvider
  //               .socialId as Id<'socialProviders'>,
  //             content: alt.content,
  //           })),
  //           ...(input.providerSettings && {
  //             providerSettings: input.providerSettings.map((ps) => ({
  //               socialProviderId: ps.socialProviderId as Id<'socialProviders'>,
  //               type: ps.type,
  //               settings: ps.settings,
  //             })),
  //           }),
  //         },
  //         {
  //           token: ctx.token,
  //         }
  //       );

  //       if (!savePostId) {
  //         throw new TRPCError({
  //           code: 'INTERNAL_SERVER_ERROR',
  //           message: 'Failed to save post',
  //         });
  //       }

  //       const post = await fetchQuery(
  //         api.posts.getPostById,
  //         {
  //           id: savePostId,
  //         },
  //         {
  //           token: ctx.token,
  //         }
  //       );
  //       if (!post) {
  //         throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
  //       }
  //       await createPostInQueue(post);
  //     }

  //     const post = await fetchQuery(
  //       api.posts.getPostById,
  //       {
  //         id: input.id as Id<'posts'>,
  //       },
  //       {
  //         token: ctx.token,
  //       }
  //     );
  //     if (!post) {
  //       throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
  //     }
  //     await createPostInQueue(post);
  //     return {
  //       success: true,
  //     };
  //   }),
  createPostFromPostId: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Get the post with its related data
      const post = await fetchQuery(
        api.posts.getPostById,
        {
          id: input.postId as Id<"posts">,
        },
        {
          token: ctx.token,
        }
      );
      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }
      if (!post.userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      await createPostInQueue(post);
      return {
        success: true,
      };
    }),
  connectFacebookPage: protectedProcedure
    .input(FacebookPageConnectionSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId;
      const externalId = ctx.externalId;

      // Check if user has reached their social account limit (single efficient query)
      const limitCheck = await fetchQuery(
        api.subscriptions.checkSocialAccountLimit,
        {},
        { token: ctx.token }
      );

      // Check if this specific page is already connected (update/transfer case)
      const currentAccounts = await fetchQuery(
        api.social_providers.getConnectedAccounts,
        {},
        { token: ctx.token }
      );

      const isExistingPage = currentAccounts.some(
        (acc) => acc.profileId === input.pageId
      );

      // Only validate limit if creating NEW connection
      if (!(isExistingPage || limitCheck.allowed)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `LIMIT_EXCEEDED: You have reached your ${limitCheck.planType} plan limit of ${limitCheck.limit} social accounts. Upgrade to connect more accounts.`,
        });
      }

      // Securely retrieve the page access token from KV storage
      let pageAccessToken: string;
      try {
        const env = await getCloudflareEnv();
        const key = `fb-pages-${externalId}-${input.code}`;

        // Type assertion for Cloudflare KV namespace
        const facebookPagesKV = env.DELULU_FACEBOOK_PAGES;
        const encryptedData = await facebookPagesKV.get(key);
        if (!encryptedData) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Facebook pages data not found or expired",
          });
        }

        const decryptedData = await decryptData(encryptedData);
        const rawPages = JSON.parse(decryptedData);

        // Validate the data structure with Zod schema
        const pagesValidationResult =
          FacebookPagesWithTokenSchema.safeParse(rawPages);
        if (!pagesValidationResult.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Invalid Facebook pages data structure",
          });
        }

        const pages: FacebookPagesWithToken = pagesValidationResult.data;

        const selectedPage = pages.find((page) => page.id === input.pageId);
        if (!selectedPage?.access_token) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Selected Facebook page not found",
          });
        }

        pageAccessToken = selectedPage.access_token;

        // Clean up the KV storage entry after retrieving the token
        await facebookPagesKV.delete(key);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve Facebook page data",
        });
      }

      // Call Convex mutation (will have its own backup validation)
      await fetchMutation(
        api.social_providers.connectFacebookPage,
        {
          userId,
          pageId: input.pageId,
          pageName: input.pageName,
          accessToken: pageAccessToken,
        },
        {
          token: ctx.token,
        }
      );

      return { status: "connected" };
    }),
  getTikTokCreatorInfo: protectedProcedure
    .input(
      z.object({
        socialProviderId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Get the TikTok social provider with access token
      let socialProvider = await fetchQuery(
        api.social_providers.getSocialProviderWithDecryptedTokens,
        {
          id: input.socialProviderId as Id<"socialProviders">,
        },
        {
          token: ctx.token,
        }
      );

      if (!socialProvider?.accessToken) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "TikTok account not found or access token missing",
        });
      }

      // Check if access token expires within the next 2 hours (proactive refresh)
      const currentTime = Date.now();
      const twoHoursFromNow = currentTime + 2 * 60 * 60 * 1000; // 2 hours in milliseconds
      const tokenExpired =
        socialProvider.expiresIn && socialProvider.expiresIn < twoHoursFromNow;

      if (tokenExpired && socialProvider.refreshToken) {
        try {
          // Refresh the access token
          const refreshResponse = await fetch(
            "https://open.tiktokapis.com/v2/oauth/token/",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Cache-Control": "no-cache",
              },
              body: new URLSearchParams({
                client_key: keys().TIKTOK_CLIENT_ID,
                client_secret: keys().TIKTOK_CLIENT_SECRET,
                grant_type: "refresh_token",
                refresh_token: socialProvider.refreshToken,
              }),
            }
          );

          if (refreshResponse.ok) {
            const refreshData = (await refreshResponse.json()) as {
              access_token: string;
              refresh_token: string;
              expires_in: number;
            };
            const { access_token, refresh_token, expires_in } = refreshData;

            // Update the database with new tokens
            await fetchMutation(
              api.social_providers.updateSocialProvider,
              {
                id: input.socialProviderId as Id<"socialProviders">,
                accessToken: access_token,
                refreshToken: refresh_token,
                expiresIn: Date.now() + expires_in * 1000,
              },
              {
                token: ctx.token,
              }
            );

            // Update our local reference to use the new token
            socialProvider = {
              ...socialProvider,
              accessToken: access_token,
              refreshToken: refresh_token,
              expiresIn: Date.now() + expires_in * 1000,
            };
          }
        } catch (_refreshError) {
          // Continue with old token - might still work or will fail gracefully
        }
      }

      try {
        const response = await fetch(
          "https://open.tiktokapis.com/v2/post/publish/creator_info/query/",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${socialProvider.accessToken}`,
              "Content-Type": "application/json; charset=UTF-8",
            },
          }
        );

        if (!response.ok) {
          const errorBody = await response.text().catch(() => undefined);
          log.error("TikTok creator_info/query failed", {
            status: response.status,
            statusText: response.statusText,
            body: errorBody,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `TikTok API error: ${response.status}`,
          });
        }

        const data = (await response.json()) as {
          error?: {
            code: string;
            message?: string;
          };
          data?: {
            creator_username?: string;
            creator_nickname?: string;
            creator_avatar_url?: string;
            privacy_level_options?: string[];
            comment_disabled?: boolean;
            duet_disabled?: boolean;
            stitch_disabled?: boolean;
            max_video_post_duration_sec?: number;
          };
        };

        console.log(data.data?.privacy_level_options);

        // Check for specific error codes that require user action
        if (data.error?.code && data.error.code !== "ok") {
          if (data.error.code === "spam_risk_too_many_posts") {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: "Daily post limit reached. Please try again tomorrow.",
            });
          }
          if (data.error.code === "spam_risk_user_banned_from_posting") {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Your TikTok account is banned from posting.",
            });
          }
          if (data.error.code === "reached_active_user_cap") {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: "Daily quota limit reached. Please try again later.",
            });
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: data.error.message || "Failed to get creator info",
          });
        }

        if (!data.data?.creator_username) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to get creator info from TikTok response",
          });
        }

        return {
          creator_username: data.data.creator_username,
          creator_nickname: data.data.creator_nickname,
          creator_avatar_url: data.data.creator_avatar_url,
          privacy_level_options: data.data.privacy_level_options || [],
          comment_disabled: data.data.comment_disabled,
          duet_disabled: data.data.duet_disabled,
          stitch_disabled: data.data.stitch_disabled,
          max_video_post_duration_sec:
            data.data.max_video_post_duration_sec || 60,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch TikTok creator info",
        });
      }
    }),
  getInstagramPosts: protectedProcedure
    .input(
      z.object({
        socialProviderId: z.string(),
        limit: z.number().min(1).max(50).optional().default(25),
      })
    )
    .query(async ({ input, ctx }) => {
      // Get social provider with decrypted tokens
      const provider = await fetchQuery(
        api.social_providers.getSocialProviderWithDecryptedTokens,
        { id: input.socialProviderId as Id<"socialProviders"> },
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
          message: "This endpoint only supports Instagram accounts",
        });
      }

      try {
        const response = await fetch(
          `https://graph.instagram.com/v24.0/${provider.profileId}/media?fields=id,caption,media_type,timestamp,permalink,thumbnail_url,media_url&limit=${input.limit}&access_token=${provider.accessToken}`
        );

        if (!response.ok) {
          const errorBody = await response.text().catch(() => undefined);
          log.error("Instagram media fetch failed", {
            status: response.status,
            statusText: response.statusText,
            body: errorBody,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Instagram API error: ${response.status}`,
          });
        }

        const data = (await response.json()) as {
          data?: Array<{
            id: string;
            caption?: string;
            media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
            timestamp: string;
            permalink: string;
            thumbnail_url?: string;
            media_url?: string;
          }>;
          error?: { message: string };
        };

        if (data.error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: data.error.message || "Failed to fetch Instagram posts",
          });
        }

        const posts = data.data || [];

        return posts.map((p) => ({
          id: p.id,
          caption: p.caption || "",
          mediaType: p.media_type,
          thumbnailUrl: p.thumbnail_url || p.media_url || "",
          permalink: p.permalink,
          timestamp: p.timestamp,
        }));
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch Instagram posts",
        });
      }
    }),
  getInstagramStories: protectedProcedure
    .input(
      z.object({
        socialProviderId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const provider = await fetchQuery(
        api.social_providers.getSocialProviderWithDecryptedTokens,
        { id: input.socialProviderId as Id<"socialProviders"> },
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
          message: "This endpoint only supports Instagram accounts",
        });
      }

      try {
        const response = await fetch(
          `https://graph.instagram.com/v24.0/${provider.profileId}/stories?fields=id,caption,media_type,timestamp,permalink,thumbnail_url,media_url&access_token=${provider.accessToken}`
        );

        if (!response.ok) {
          const errorBody = await response.text().catch(() => undefined);
          log.error("Instagram stories fetch failed", {
            status: response.status,
            statusText: response.statusText,
            body: errorBody,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Instagram API error: ${response.status}`,
          });
        }

        const data = (await response.json()) as {
          data?: Array<{
            id: string;
            caption?: string;
            media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
            timestamp: string;
            permalink: string;
            thumbnail_url?: string;
            media_url?: string;
          }>;
          error?: { message: string };
        };

        if (data.error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: data.error.message || "Failed to fetch Instagram stories",
          });
        }

        const stories = data.data || [];

        return stories.map((s) => ({
          id: s.id,
          caption: s.caption || "",
          mediaType: s.media_type,
          thumbnailUrl: s.thumbnail_url || s.media_url || "",
          permalink: s.permalink,
          timestamp: s.timestamp,
        }));
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch Instagram stories",
        });
      }
    }),
  deleteSocialProvider: protectedProcedure
    .input(
      z.object({
        socialProviderId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Get the social provider with decrypted tokens
      const socialProvider = await fetchQuery(
        api.social_providers.getSocialProviderWithDecryptedTokens,
        {
          id: input.socialProviderId as Id<"socialProviders">,
        },
        {
          token: ctx.token,
        }
      );

      if (!socialProvider) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Social account not found",
        });
      }

      // Verify ownership (check that the social provider belongs to the current user)
      if (socialProvider.userId !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this account",
        });
      }

      // If TikTok, revoke the access token before deletion
      if (
        socialProvider.socialType === "TIKTOK" &&
        socialProvider.accessToken
      ) {
        try {
          log.info("Revoking TikTok access token", {
            socialProviderId: input.socialProviderId,
          });

          const revokeResponse = await fetch(
            "https://open.tiktokapis.com/v2/oauth/revoke/",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                client_key: keys().TIKTOK_CLIENT_ID,
                client_secret: keys().TIKTOK_CLIENT_SECRET,
                token: socialProvider.accessToken,
              }),
            }
          );

          if (revokeResponse.ok) {
            log.info("Successfully revoked TikTok access token", {
              socialProviderId: input.socialProviderId,
            });
          } else {
            const errorBody = await revokeResponse
              .text()
              .catch(() => undefined);
            log.warn(
              "Failed to revoke TikTok token (continuing with deletion)",
              {
                socialProviderId: input.socialProviderId,
                status: revokeResponse.status,
                body: errorBody,
              }
            );
            // Continue with deletion even if revocation failed
          }
        } catch (error) {
          log.error(
            "Error during TikTok token revocation (continuing with deletion)",
            {
              socialProviderId: input.socialProviderId,
              error,
            }
          );
          // Continue with deletion even if revocation threw an error
        }
      }

      // Delete from database (cascade deletion handles cleanup)
      await fetchMutation(
        api.social_providers.deleteSocial,
        {
          socialId: input.socialProviderId as Id<"socialProviders">,
        },
        {
          token: ctx.token,
        }
      );

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
