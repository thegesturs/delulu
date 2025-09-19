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

      const stuff = await createPostInQueue(post);
      console.log('stuff', stuff);
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
      const socialProvider = await fetchQuery(
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

      try {
        const params = new URLSearchParams({
          fields: 'open_id,union_id,avatar_url,avatar_url_100,avatar_url_200,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count'
        });

        const response = await fetch(
          `https://open.tiktokapis.com/v2/user/info/?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${socialProvider.accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `TikTok API error: ${response.status}`,
          });
        }

        const data = await response.json();

        if (!data.data?.display_name) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get creator info from TikTok response',
          });
        }

        return {
          display_name: data.data.display_name,
          bio_description: data.data.bio_description || '',
          avatar_url: data.data.avatar_url,
          follower_count: data.data.follower_count,
          following_count: data.data.following_count,
          likes_count: data.data.likes_count,
          video_count: data.data.video_count,
          is_verified: data.data.is_verified,
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
  validateTikTokVideo: protectedProcedure
    .input(
      z.object({
        videoUrl: z.string().url(),
        // Additional validation can be added here for duration, file size, etc.
      })
    )
    .query(async ({ input }) => {
      // For now, this is a placeholder that validates the URL format
      // In a full implementation, you might want to:
      // 1. Fetch video metadata to check duration (15 seconds to 10 minutes)
      // 2. Validate file size, format, etc.
      // 3. Use a video processing library to analyze the video

      try {
        // Validate URL format
        new URL(input.videoUrl);

        // Basic validation - video should be accessible
        const response = await fetch(input.videoUrl, { method: 'HEAD' });

        if (!response.ok) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Video URL is not accessible',
          });
        }

        const contentType = response.headers.get('content-type');
        if (!contentType?.startsWith('video/')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'URL does not point to a video file',
          });
        }

        // For now, return success - can be enhanced with actual video analysis
        return {
          valid: true,
          message: 'Video URL is valid and accessible',
          contentType,
          contentLength: response.headers.get('content-length'),
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid video URL format',
        });
      }
    }),
} satisfies TRPCRouterRecord;
