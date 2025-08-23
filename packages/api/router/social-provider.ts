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
} satisfies TRPCRouterRecord;
