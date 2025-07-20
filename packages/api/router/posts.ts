import { postQueries } from '@delulu/database';
import {
  savePostInputSchema,
  updatePostInputSchema,
} from '@delulu/validators/post';
import type { TRPCRouterRecord } from '@trpc/server';
import { protectedProcedure } from '../trpc';

export const postRouter = {
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
} satisfies TRPCRouterRecord;
