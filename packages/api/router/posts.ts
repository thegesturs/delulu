import {
  alternatePostContent,
  database,
  postQueries,
  posts,
} from '@delulu/database';
import { and, count, desc, eq, gte, lte } from '@delulu/database';
import {
  savePostInputSchema,
  updatePostInputSchema,
} from '@delulu/validators/post';
import type { TRPCRouterRecord } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure } from '../trpc';

// Create a schema for post filters
const PostFiltersSchema = z.object({
  status: z
    .enum(['SAVED', 'PUBLISHED', 'SCHEDULED', 'DELETED', 'FAILED'])
    .optional(),
  privacyStatus: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  reviewStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
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
      const [post] = await postQueries.getPostById(input.id);
      return post || null;
    }),
  getPostsByUserId: protectedProcedure
    .input(
      z.object({
        filters: PostFiltersSchema.optional(),
        pagination: PaginationSchema.optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const filters = input.filters || {};
      const pagination = input.pagination || {};

      // Build where conditions
      const conditions = [
        eq(posts.userId, ctx.userId),
        eq(posts.isDeleted, false),
      ];

      if (filters.status) {
        conditions.push(eq(posts.status, filters.status));
      }
      if (filters.privacyStatus) {
        conditions.push(eq(posts.privacyStatus, filters.privacyStatus));
      }
      if (filters.reviewStatus) {
        conditions.push(eq(posts.reviewStatus, filters.reviewStatus));
      }
      if (filters.organizationId) {
        conditions.push(eq(posts.organizationId, filters.organizationId));
      }
      if (filters.startDate) {
        conditions.push(gte(posts.createdAt, filters.startDate));
      }
      if (filters.endDate) {
        conditions.push(lte(posts.createdAt, filters.endDate));
      }

      const whereClause = and(...conditions);

      const [postsResult, totalResult] = await Promise.all([
        database
          .select()
          .from(posts)
          .where(whereClause)
          .orderBy(desc(posts.createdAt))
          .limit(pagination.take || 50)
          .offset(pagination.skip || 0),
        database.select({ count: count() }).from(posts).where(whereClause),
      ]);

      return {
        posts: postsResult,
        total: totalResult[0]?.count || 0,
      };
    }),
  savePost: protectedProcedure
    .input(savePostInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Create the main post
      const [post] = await database
        .insert(posts)
        .values({
          content: input.content,
          status: 'SAVED',
          userId: ctx.userId,
          organizationId: ctx.organizationId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!post) {
        throw new Error('Failed to create post');
      }

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
      return post;
    }),
  updatePost: protectedProcedure
    .input(updatePostInputSchema)
    .mutation(async ({ input }) => {
      // Update the main post
      const [post] = await database
        .update(posts)
        .set({
          content: input.content,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, input.postId))
        .returning();

      // Handle alternate contents
      if (input.alternativeContent?.length > 0) {
        // Delete existing alternate contents
        await database
          .delete(alternatePostContent)
          .where(eq(alternatePostContent.postId, input.postId));

        // Insert new alternate contents
        await database.insert(alternatePostContent).values(
          input.alternativeContent.map((alt) => ({
            postId: input.postId,
            socialProviderId: alt.socialProvider.socialId,
            content: alt.content,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        );
      }

      return post;
    }),
  softDeletePost: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const [post] = await database
        .update(posts)
        .set({
          isDeleted: true,
          status: 'DELETED',
          updatedAt: new Date(),
        })
        .where(eq(posts.id, input.id))
        .returning();
      return post;
    }),
  hardDeletePost: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await database.delete(posts).where(eq(posts.id, input.id));
      return { success: true };
    }),
  getScheduledPosts: protectedProcedure
    .input(
      z.object({
        filters: PostFiltersSchema.optional(),
        pagination: PaginationSchema.optional(),
      })
    )
    .query(async ({ input }) => {
      const filters = input.filters || {};
      const pagination = input.pagination || {};

      const conditions = [
        eq(posts.status, 'SCHEDULED'),
        gte(posts.scheduledAt, new Date()),
      ];

      if (filters.organizationId) {
        conditions.push(eq(posts.organizationId, filters.organizationId));
      }
      if (filters.startDate) {
        conditions.push(gte(posts.createdAt, filters.startDate));
      }
      if (filters.endDate) {
        conditions.push(lte(posts.createdAt, filters.endDate));
      }

      const whereClause = and(...conditions);

      const [postsResult, totalResult] = await Promise.all([
        database
          .select()
          .from(posts)
          .where(whereClause)
          .orderBy(posts.scheduledAt)
          .limit(pagination.take || 50)
          .offset(pagination.skip || 0),
        database.select({ count: count() }).from(posts).where(whereClause),
      ]);

      return {
        posts: postsResult,
        total: totalResult[0]?.count || 0,
      };
    }),
} satisfies TRPCRouterRecord;
