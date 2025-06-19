import { getPostById, saveIncomingPost } from '@api/db/post.repository';
import { createPostInQueue } from '@api/services/post.service';
import { PostStatus } from '@delulu/database';
import {
  type ContentType,
  type SavePostInputType,
  SocialTypeSchema,
  savePostInputSchema,
} from '@delulu/validators/post';
import { TRPCError, type TRPCRouterRecord } from '@trpc/server';
import { z } from 'zod';
import { providerRegistry } from '../providers';
import { protectedProcedure } from '../trpc';

export const socialProviderRouter = {
  getSocialProviderConnectUrl: protectedProcedure
    .input(
      z.object({
        provider: SocialTypeSchema.extract([
          'LINKEDIN',
          'TWITTER',
          'TIKTOK',
          'INSTAGRAM',
        ]),
      })
    )
    .mutation(({ input }) => {
      return providerRegistry[input.provider].connectUrl();
    }),

  getConnectedAccounts: protectedProcedure.query(async ({ ctx }) => {
    const socialProviders = await ctx.db.socialProvider.findMany({
      where: {
        userId: ctx.userId,
      },
    });

    return socialProviders;
  }),
  createPost: protectedProcedure
    .input(savePostInputSchema)
    .mutation(async ({ input, ctx }) => {
      let postId = input.id;
      if (!input.id) {
        const post = await saveIncomingPost(
          input,
          PostStatus.SAVED,
          ctx.userId,
          ctx.organizationId
        );
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
      const post = await getPostById(input.postId);
      console.log('Post:', post);
      if (!post) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
      }

      const postData: SavePostInputType = {
        id: post.id,
        content: (post.content as unknown[]).map((item) => ({
          ...(item as ContentType),
        })),
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
          content: (alt.content as unknown[]).map((item) => ({
            ...(item as ContentType),
          })),
        })),
      };

      console.log('Post data:', postData);

      await createPostInQueue(postData);
      return {
        success: true,
      };
    }),
} satisfies TRPCRouterRecord;
