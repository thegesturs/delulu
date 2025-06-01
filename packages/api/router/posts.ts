import {
  PostCreateInputSchema,
  PostReviewStatusSchema,
  PostStatusSchema,
  PostUpdateInputSchema,
  PrivacyStatusSchema,
} from '@delulu/database/prisma/types/zod';
import type { TRPCRouterRecord } from '@trpc/server';
import {
  getPostById,
  getPostsByUserId,
  getScheduledPosts,
  hardDeletePost,
  savePost,
  softDeletePost,
  updatePost,
} from 'db/post.repository';
import { publicProcedure } from 'trpc';
import { z } from 'zod';

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

export const posting = {
  getPostById: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input }) => {
      const post = await getPostById(input.id);
      return post;
    }),
  getPostsByUserId: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        filters: PostFiltersSchema.optional(),
        pagination: PaginationSchema.optional(),
      })
    )
    .query(async ({ input }) => {
      const posts = await getPostsByUserId(
        input.userId,
        input.filters || {},
        input.pagination
      );
      return posts;
    }),
  createPost: publicProcedure
    .input(PostCreateInputSchema)
    .mutation(async ({ input }) => {
      const post = await savePost(input);
      return post;
    }),
  updatePost: publicProcedure
    .input(
      z.object({
        id: z.string(),
        data: PostUpdateInputSchema,
      })
    )
    .mutation(async ({ input }) => {
      const post = await updatePost(input.id, input.data);
      return post;
    }),
  softDeletePost: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const post = await softDeletePost(input.id);
      return post;
    }),
  hardDeletePost: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const post = await hardDeletePost(input.id);
      return post;
    }),
  getScheduledPosts: publicProcedure
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
