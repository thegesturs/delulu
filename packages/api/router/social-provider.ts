import { createPostInQueue } from '@api/services/post.service';
import { getCloudflareEnv } from '@delulu/cloudflare-types';
import {
  alternatePostContent,
  database,
  posts,
  socialQueries,
} from '@delulu/database';
import {} from '@delulu/database';
import { decryptData } from '@delulu/database/encrypt';
import {
  FacebookPageConnectionSchema,
  type FacebookPagesWithToken,
  FacebookPagesWithTokenSchema,
} from '@delulu/validators/facebook';

import { api } from '@delulu/database/convex/_generated/api';
import {
  type SavePostInputType,
  SocialTypeSchema,
  savePostInputSchema,
} from '@delulu/validators/post';
import { TRPCError, type TRPCRouterRecord } from '@trpc/server';
import { z } from 'zod';
import { providerRegistry } from '../providers';
import { protectedProcedure, publicProcedure } from '../trpc';

// Add type imports
import type { SocialType } from '@delulu/database/convex/utils';

// Define interfaces for the provider and alt objects
interface PostToSocialProvider {
  socialProvider: {
    id: string;
    fullName: string;
    socialType: SocialType;
  };
}

interface AlternateContent {
  socialProvider: {
    id: string;
    fullName: string;
    socialType: SocialType;
  };
  content: string;
}

export const socialProviderRouter = {
  getSocialProviderConnectUrl: protectedProcedure
    .input(
      z.object({
        provider: SocialTypeSchema.exclude(['DEFAULT', 'LENS']),
      })
    )
    .mutation(({ input }) => {
      const link = providerRegistry[input.provider].connectUrl();

      console.log('Link:', link);

      return link;
    }),

  getConnectedAccounts: protectedProcedure.query(async ({ ctx }) => {
    const userSocialProviders = await socialQueries.getUserSocialProviders(
      ctx.userId
    );
    return userSocialProviders;
  }),
  deleteSocial: protectedProcedure
    .input(z.object({ socialId: z.string() }))
    .mutation(async ({ input }) => {
      await socialQueries.deleteSocialProvider(input.socialId);
      return {
        success: true,
      };
    }),
  createPost: protectedProcedure
    .input(savePostInputSchema)
    .mutation(async ({ input, ctx }) => {
      if (!input.id) {
        // Create the main post
        const [post] = await database
          .insert(posts)
          .values({
            content: input.content,
            status: 'SAVED',
            userId: ctx.userId,
            // organizationId: ctx.organizationId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        // Create alternate contents if any
        if (input.alternativeContent?.length > 0) {
          await database.insert(alternatePostContent).values(
            input.alternativeContent.map((alt) => ({
              postId: post.id,
              socialProviderId: alt.socialProvider.socialId,
              content: alt.content,
              createdAt: new Date(),
              updatedAt: new Date(),
            }))
          );
        }
      }
      //TODO: Make this work using AWS SQS
      // await createPostInQueue({ ...input, id: postId });
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
      const post = await ctx.db.query(api.posts.getPostById, {
        postId: input.postId,
      });
      if (!post) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
      }
      if (!post.userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }
      const postData: SavePostInputType = {
        id: post.id,
        content: post.content,
        socialProviders: post.postToSocialProviders.map(
          (provider: PostToSocialProvider) => ({
            socialId: provider.socialProvider.id,
            name: provider.socialProvider.fullName,
            socialType: provider.socialProvider.socialType,
          })
        ),
        alternativeContent: post.alternateContents.map(
          (alt: AlternateContent) => ({
            socialProvider: {
              socialId: alt.socialProvider.id,
              name: alt.socialProvider.fullName,
              socialType: alt.socialProvider.socialType,
            },
            content: alt.content,
          })
        ),
      };

      //TODO: Make this work using AWS SQS
      console.log('Post data:', 'stuff');
      const stuff = await createPostInQueue(postData);
      console.log('Test:', stuff);
      return {
        success: true,
      };
    }),
  connectFacebookPage: publicProcedure
    .input(FacebookPageConnectionSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to connect a Facebook page',
        });
      }

      // Securely retrieve the page access token from KV storage
      let pageAccessToken: string;
      try {
        const env = await getCloudflareEnv();
        const key = `fb-pages-${userId}-${input.code}`;

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

      await ctx.db.mutation(api.social_providers.connectFacebookPage, {
        userId,
        pageId: input.pageId,
        pageName: input.pageName,
        accessToken: pageAccessToken,
      });

      return { status: 'connected' };
    }),
} satisfies TRPCRouterRecord;
