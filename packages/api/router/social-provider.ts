import { createPostInQueue } from '@api/services/post.service';
// import { createPostInQueue } from '@api/services/post.service';
import {
  alternatePostContent,
  database,
  postQueries,
  posts,
  socialProviders,
  socialQueries,
} from '@delulu/database';
import { and, eq, ne } from '@delulu/database';
import {
  type SavePostInputType,
  SocialTypeSchema,
  savePostInputSchema,
} from '@delulu/validators/post';
import { TRPCError, type TRPCRouterRecord } from '@trpc/server';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { providerRegistry } from '../providers';
import { protectedProcedure, publicProcedure } from '../trpc';

export const socialProviderRouter = {
  getSocialProviderConnectUrl: protectedProcedure
    .input(
      z.object({
        provider: SocialTypeSchema.exclude(['DEFAULT', 'LENS']),
      })
    )
    .mutation(({ input }) => {
      return providerRegistry[input.provider].connectUrl();
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
      let postId = input.id;
      if (!input.id) {
        const newPostId = `post_${nanoid(12)}`;

        // Create the main post
        const [post] = await database
          .insert(posts)
          .values({
            id: newPostId,
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
              postId: newPostId,
              socialProviderId: alt.socialProvider.socialId,
              content: alt.content,
              createdAt: new Date(),
              updatedAt: new Date(),
            }))
          );
        }

        postId = post.id;
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
    .mutation(async ({ input }) => {
      // Get the post with its related data
      const post = await postQueries.getPostById(input.postId);
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
        socialProviders: post.postToSocialProviders.map((provider) => ({
          socialId: provider.socialProvider.id,
          name: provider.socialProvider.fullName,
          socialType: provider.socialProvider.socialType,
        })),
        alternativeContent: post.alternateContents.map((alt) => ({
          socialProvider: {
            socialId: alt.socialProvider.id,
            name: alt.socialProvider.fullName,
            socialType: alt.socialProvider.socialType,
          },
          content: alt.content,
        })),
      };

      //TODO: Make this work using AWS SQS
      console.log('Post data:', 'stuff');
      const test = await createPostInQueue(postData);
      console.log('Test:', test);
      return {
        success: true,
      };
    }),
  connectFacebookPage: publicProcedure
    .input(
      z.object({
        pageId: z.string(),
        pageName: z.string(),
        pageAccessToken: z.string(),
        code: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to connect a Facebook page',
        });
      }

      // Check if this Facebook page is already connected to a different user
      const existingProvider = await database
        .select()
        .from(socialProviders)
        .where(
          and(
            eq(socialProviders.profileId, input.pageId),
            ne(socialProviders.userId, userId)
          )
        )
        .limit(1);

      // If found, handle the transfer
      if (existingProvider.length > 0) {
        await database
          .update(socialProviders)
          .set({
            userId,
            accessToken: input.pageAccessToken,
            fullName: input.pageName,
            username: input.pageName,
            profileImage: `https://graph.facebook.com/${input.pageId}/picture?type=large`,
            refreshTokenExpiresIn: new Date(
              Date.now() + 2 * 30 * 24 * 60 * 60 * 1000
            ),
            updatedAt: new Date(),
            isActive: true,
            lastSyncedAt: new Date(),
          })
          .where(eq(socialProviders.id, existingProvider[0].id));

        return { status: 'transferred' };
      }

      // Upsert the social provider using conflict resolution
      await database
        .insert(socialProviders)
        .values({
          userId,
          socialType: 'FACEBOOK',
          accessToken: input.pageAccessToken,
          profileId: input.pageId,
          username: input.pageName,
          fullName: input.pageName,
          profileImage: `https://graph.facebook.com/${input.pageId}/picture?type=large`,
          isActive: true,
          lastSyncedAt: new Date(),
          expiresIn: new Date(Date.now() + 2 * 30 * 24 * 60 * 60 * 1000),
        })
        .onConflictDoUpdate({
          target: [socialProviders.userId, socialProviders.profileId],
          set: {
            accessToken: input.pageAccessToken,
            fullName: input.pageName,
            username: input.pageName,
            profileImage: `https://graph.facebook.com/${input.pageId}/picture?type=large`,
            updatedAt: new Date(),
            isActive: true,
            lastSyncedAt: new Date(),
          },
        });

      return { status: 'connected' };
    }),
} satisfies TRPCRouterRecord;
