import { postQueries } from '@delulu/database';
import {
  savePostInputSchema,
  updatePostInputSchema,
} from '@delulu/validators/post';
import { TRPCError, type TRPCRouterRecord } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure } from '../trpc';

const getPostsInputSchema = z.object({
  filters: z
    .object({
      status: z
        .enum(['SAVED', 'PUBLISHED', 'SCHEDULED', 'DELETED', 'FAILED'])
        .optional(),
      privacyStatus: z.enum(['PUBLIC', 'PRIVATE']).optional(),
      reviewStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
      organizationId: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    })
    .optional(),
  pagination: z
    .object({
      skip: z.number().optional(),
      take: z.number().optional(),
    })
    .optional(),
});

export const postRouter = {
  getPosts: protectedProcedure
    .input(getPostsInputSchema)
    .query(async ({ input, ctx }) => {
      const filters = input.filters || {};
      const pagination = input.pagination || {};

      const { posts, total } = await postQueries.getPostsByUserId(
        ctx.userId ?? '',
        {
          ...filters,
          isDeleted: false, // Always include isDeleted filter for this endpoint
        },
        pagination
      );

      return {
        posts,
        total,
      };
    }),

  getPostById: protectedProcedure.input(z.string()).query(async ({ input }) => {
    const post = await postQueries.getPostById(input);
    if (!post) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found',
      });
    }
    return post;
  }),

  savePost: protectedProcedure
    .input(savePostInputSchema)
    .mutation(async ({ input, ctx }) => {
      return await postQueries.saveIncomingPost({
        post: input,
        userId: ctx.userId,
        postStatus: 'SAVED',
      });
    }),

  updatePost: protectedProcedure
    .input(updatePostInputSchema)
    .mutation(async ({ input }) => {
      return await postQueries.updatePostContent(
        input.postId,
        input.content,
        input.alternativeContent
      );
    }),

  deletePost: protectedProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      return await postQueries.softDeletePost(input);
    }),
} satisfies TRPCRouterRecord;
