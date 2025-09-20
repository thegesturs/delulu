import { keys } from '@api/keys';
import { createPostInQueue } from '@api/services/post.service';
import { getCloudflareEnv } from '@delulu/cloudflare-types';
import {
  FacebookPageConnectionSchema,
  type FacebookPagesWithToken,
  FacebookPagesWithTokenSchema,
} from '@delulu/validators/facebook';

import { api } from '@delulu/database/convex/_generated/api';
import { decryptData } from '@delulu/database/convex/utils';
import { SocialTypeSchema, savePostInputSchema } from '@delulu/validators/post';
import { TRPCError, type TRPCRouterRecord } from '@trpc/server';
import { z } from 'zod';
import { connectUrlRegistry } from '../services/connect-url.service';
import { protectedProcedure } from '../trpc';

import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { fetchMutation } from '@delulu/database/server';
import { fetchQuery } from '@delulu/database/server';

export const socialProviderRouter = {
  getSocialProviderConnectUrl: protectedProcedure
    .input(
      z.object({
        provider: SocialTypeSchema.exclude(['DEFAULT', 'LENS']),
      })
    )
    .query(({ input }) => {
      const link = connectUrlRegistry[input.provider].connectUrl();
      return link;
    }),
  createPost: protectedProcedure
    .input(savePostInputSchema)
    .mutation(async ({ input, ctx }) => {
      if (!input.id) {
        const savePostId = await fetchMutation(
          api.posts.createPost,
          {
            userId: ctx.userId,
            content: input.content,
            status: 'SAVED',
            socialProviderIds: input.socialProviders.map(
              (sp) => sp.socialId as Id<'socialProviders'>
            ),
            alternativeContent: input.alternativeContent.map((alt) => ({
              socialProviderId: alt.socialProvider
                .socialId as Id<'socialProviders'>,
              content: alt.content,
            })),
          },
          {
            token: ctx.token,
          }
        );

        if (!savePostId) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to save post',
          });
        }

        const post = await fetchQuery(
          api.posts.getPostById,
          {
            id: savePostId,
          },
          {
            token: ctx.token,
          }
        );
        if (!post) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
        }
        await createPostInQueue(post);
      }

      const post = await fetchQuery(
        api.posts.getPostById,
        {
          id: input.id as Id<'posts'>,
        },
        {
          token: ctx.token,
        }
      );
      if (!post) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
      }
      await createPostInQueue(post);
      return {
        success: true,
      };
    }),
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
          id: input.postId as Id<'posts'>,
        },
        {
          token: ctx.token,
        }
      );
      if (!post) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
      }
      if (!post.userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
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
            code: 'NOT_FOUND',
            message: 'Facebook pages data not found or expired',
          });
        }

        const decryptedData = await decryptData(encryptedData);
        const rawPages = JSON.parse(decryptedData);

        // Validate the data structure with Zod schema
        const pagesValidationResult =
          FacebookPagesWithTokenSchema.safeParse(rawPages);
        if (!pagesValidationResult.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Invalid Facebook pages data structure',
          });
        }

        const pages: FacebookPagesWithToken = pagesValidationResult.data;

        const selectedPage = pages.find((page) => page.id === input.pageId);
        if (!selectedPage?.access_token) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Selected Facebook page not found',
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
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve Facebook page data',
        });
      }

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

      return { status: 'connected' };
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
          id: input.socialProviderId as Id<'socialProviders'>,
        },
        {
          token: ctx.token,
        }
      );

      if (!socialProvider?.accessToken) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'TikTok account not found or access token missing',
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
            'https://open.tiktokapis.com/v2/oauth/token/',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cache-Control': 'no-cache',
              },
              body: new URLSearchParams({
                client_key: keys().TIKTOK_CLIENT_ID,
                client_secret: keys().TIKTOK_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: socialProvider.refreshToken,
              }),
            }
          );

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json() as {
              access_token: string;
              refresh_token: string;
              expires_in: number;
            };
            const { access_token, refresh_token, expires_in } = refreshData;

            // Update the database with new tokens
            await fetchMutation(
              api.social_providers.updateSocialProvider,
              {
                id: input.socialProviderId as Id<'socialProviders'>,
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
          'https://open.tiktokapis.com/v2/post/publish/creator_info/query/',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${socialProvider.accessToken}`,
              'Content-Type': 'application/json; charset=UTF-8',
            },
          }
        );

        if (!response.ok) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `TikTok API error: ${response.status}`,
          });
        }

        const data = await response.json() as {
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

        console.log({ data });

        // Check for specific error codes that require user action
        if (data.error?.code && data.error.code !== 'ok') {
          if (data.error.code === 'spam_risk_too_many_posts') {
            throw new TRPCError({
              code: 'TOO_MANY_REQUESTS',
              message: 'Daily post limit reached. Please try again tomorrow.',
            });
          }
          if (data.error.code === 'spam_risk_user_banned_from_posting') {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Your TikTok account is banned from posting.',
            });
          }
          if (data.error.code === 'reached_active_user_cap') {
            throw new TRPCError({
              code: 'TOO_MANY_REQUESTS',
              message: 'Daily quota limit reached. Please try again later.',
            });
          }
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: data.error.message || 'Failed to get creator info',
          });
        }

        if (!data.data?.creator_username) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get creator info from TikTok response',
          });
        }

        return {
          creator_username: data.data.creator_username,
          creator_nickname: data.data.creator_nickname,
          creator_avatar_url: data.data.creator_avatar_url,
          privacy_level_options: data.data.privacy_level_options || [],
          comment_disabled: data.data.comment_disabled || false,
          duet_disabled: data.data.duet_disabled || false,
          stitch_disabled: data.data.stitch_disabled || false,
          max_video_post_duration_sec:
            data.data.max_video_post_duration_sec || 60,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch TikTok creator info',
        });
      }
    }),
} satisfies TRPCRouterRecord;
