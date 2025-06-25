import { createPostInQueue } from '@api/services/post.service';
import {
  alternatePostContent,
  database,
  postQueries,
  posts,
  socialProviders,
  socialQueries,
} from '@delulu/database';
import { eq } from '@delulu/database';
import {
  type ContentType,
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
        provider: SocialTypeSchema.extract([
          'LINKEDIN',
          'TWITTER',
          'TIKTOK',
          'INSTAGRAM',
          'THREADS',
          'FACEBOOK',
          'PINTEREST',
          'FARCASTER',
        ]),
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
            organizationId: ctx.organizationId,
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
      const [post] = await postQueries.getPostById(input.postId);
      console.log('Post:', post);
      if (!post) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
      }

      // Get associated social providers (assuming a relation table exists)
      // This would need to be implemented based on your actual schema
      // For now, we'll use an empty array and you can adjust based on your relations
      if (!post.userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }
      const socialProvidersList = await database
        .select()
        .from(socialProviders)
        .where(eq(socialProviders.userId, post.userId));

      // Get alternate contents
      const alternateContents = await postQueries.getPostAlternateContents(
        input.postId
      );

      const postData: SavePostInputType = {
        id: post.id,
        content: (post.content as unknown[]).map((item) => ({
          ...(item as ContentType),
        })),
        socialProviders: socialProvidersList.map((provider) => ({
          socialId: provider.id,
          name: provider.fullName,
          socialType: provider.socialType,
        })),
        alternativeContent: await Promise.all(
          alternateContents.map(async (alt) => {
            const [socialProvider] = await socialQueries.getSocialProviderById(
              alt.socialProviderId
            );
            return {
              socialProvider: {
                socialId: socialProvider.id,
                name: socialProvider.fullName,
                socialType: socialProvider.socialType,
              },
              content: (alt.content as unknown[]).map((item) => ({
                ...(item as ContentType),
              })),
            };
          })
        ),
      };

      console.log('Post data:', postData);

      await createPostInQueue(postData);
      return {
        success: true,
      };
    }),
} satisfies TRPCRouterRecord;
