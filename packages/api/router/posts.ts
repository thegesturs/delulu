import { PostStatus } from '@delulu/database';
import {
  PostReviewStatusSchema,
  PostStatusSchema,
  PrivacyStatusSchema,
} from '@delulu/database/prisma/types/zod';
import {
  savePostInputSchema,
  updatePostInputSchema,
} from '@delulu/validators/post';
import type { TRPCRouterRecord } from '@trpc/server';
import { z } from 'zod';
import {
  getPostById,
  getPostsByUserId,
  getScheduledPosts,
  hardDeletePost,
  saveIncomingPost,
  softDeletePost,
  updatePostContent,
} from '../db/post.repository';
import {
  PaginatedPostsResponseSchema,
  PaginationApiSchema,
  PostFiltersApiSchema,
} from '../db/types/post.types';
import { protectedProcedure } from '../trpc';

// Create a schema for post filters
const PostFiltersSchema = z.object({
  status: PostStatusSchema.optional(),
  privacyStatus: PrivacyStatusSchema.optional(),
  reviewStatus: PostReviewStatusSchema.optional(),
  organizationId: z.string().optional(),
  isDeleted: z.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  searchTerm: z.string().optional(),
});

// Create a schema for pagination
const PaginationSchema = z.object({
  skip: z.number().optional(),
  take: z.number().optional(),
});

export const postRouter = {
  getPostById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input }) => {
      const post = await getPostById(input.id);
      return post;
    }),
  getPostsByUserId: protectedProcedure
    .input(
      z.object({
        filters: PostFiltersApiSchema.optional(),
        pagination: PaginationApiSchema.optional(),
      })
    )
    .output(PaginatedPostsResponseSchema)
    .query(async ({ input, ctx }) => {
      const result = await getPostsByUserId(
        ctx.userId,
        { ...(input.filters || {}), isDeleted: false },
        input.pagination
      );
      return result;
    }),
  savePost: protectedProcedure
    .input(savePostInputSchema)
    .mutation(async ({ input, ctx }) => {
      const post = await saveIncomingPost(
        input,
        PostStatus.SAVED,
        ctx.userId,
        ctx.organizationId
      );
      return post;
    }),
  updatePost: protectedProcedure
    .input(updatePostInputSchema)
    .mutation(async ({ input }) => {
      const post = await updatePostContent(input);
      return post;
    }),
  softDeletePost: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const post = await softDeletePost(input.id);
      return post;
    }),
  hardDeletePost: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const post = await hardDeletePost(input.id);
      return post;
    }),
  getScheduledPosts: protectedProcedure
    .input(
      z.object({
        filters: PostFiltersSchema.optional(),
        pagination: PaginationSchema.optional(),
      })
    )
    .query(async ({ input }) => {
      const posts = await getScheduledPosts(
        input.filters || {},
        input.pagination
      );
      return posts;
    }),
} satisfies TRPCRouterRecord;
