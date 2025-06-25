import { createPostInQueue } from '@api/services/post.service';
import {
  alternatePostContent,
  database,
  postQueries,
  posts,
  socialQueries,
} from '@delulu/database';
import {
  type SavePostInputType,
  SocialTypeSchema,
  savePostInputSchema,
} from '@delulu/validators/post';
import { TRPCError, type TRPCRouterRecord } from '@trpc/server';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { providerRegistry } from '../providers';
import { protectedProcedure } from '../trpc';

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
      await createPostInQueue({ ...input, id: postId });
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
        socialProviders: post.socialProviders.map((provider) => ({
          socialId: provider.id,
          name: provider.fullName,
          socialType: provider.socialType,
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

      await createPostInQueue(postData);
      return {
        success: true,
      };
    }),
} satisfies TRPCRouterRecord;
