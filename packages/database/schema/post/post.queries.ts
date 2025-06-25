import { type ContentType, contentSchema } from '@delulu/validators/post';
import { and, asc, count, desc, eq, gt, gte, lt, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { database } from '../../index';
import {
  type Post,
  type PostInsert,
  alternatePostContent,
  platformPosts,
  posts,
} from './post.sql';

export type PaginationParams = {
  skip?: number;
  take?: number;
};

// Types for filters
export type PostFilters = {
  status?: Post['status'];
  privacyStatus?: Post['privacyStatus'];
  reviewStatus?: Post['reviewStatus'];
  organizationId?: string;
  isDeleted?: boolean;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
  hasSocialProviders?: boolean;
  scheduledBefore?: Date;
  scheduledAfter?: Date;
};

// Helper function to build where clause
function buildWhereClause(filters: PostFilters = {}) {
  const conditions: ReturnType<typeof eq>[] = [];

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
  if (filters.isDeleted !== undefined) {
    conditions.push(eq(posts.isDeleted, filters.isDeleted));
  }

  if (filters.startDate) {
    conditions.push(gte(posts.createdAt, filters.startDate));
  }
  if (filters.endDate) {
    conditions.push(lte(posts.createdAt, filters.endDate));
  }

  if (filters.searchTerm) {
    conditions.push(
      sql`${posts.content}::text ILIKE ${'%' + filters.searchTerm + '%'}`
    );
  }

  if (filters.scheduledBefore) {
    conditions.push(lt(posts.scheduledAt, filters.scheduledBefore));
  }

  if (filters.scheduledAfter) {
    conditions.push(gt(posts.scheduledAt, filters.scheduledAfter));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export const postQueries = {
  // Post queries
  getPostById: async (id: string) => {
    const [post] = await database.query.posts.findMany({
      where: (posts, { eq }) => eq(posts.id, id),
      limit: 1,
      with: {
        alternateContents: {
          with: {
            socialProvider: true,
          },
        },
        socialProviders: true,
      },
    });
    return post || null;
  },

  getPostsByUserId: async (
    userId: string,
    filters: PostFilters = {},
    pagination?: { skip?: number; take?: number }
  ) => {
    const whereConditions = [eq(posts.userId, userId)];
    const filterConditions = buildWhereClause(filters);
    if (filterConditions) {
      whereConditions.push(filterConditions);
    }

    const whereClause = and(...whereConditions);

    const [databasePosts, totalResult] = await Promise.all([
      database
        .select()
        .from(posts)
        .where(whereClause)
        .orderBy(desc(posts.createdAt))
        .limit(pagination?.take || 50)
        .offset(pagination?.skip || 0),
      database.select({ count: count() }).from(posts).where(whereClause),
    ]);

    const transformedPosts = databasePosts.map((post) => {
      const parsedContent = z.array(contentSchema).safeParse(post.content);
      return {
        ...post,
        content: parsedContent.success ? parsedContent.data : [],
        alternateContents: [],
        platformPosts: [],
        socialProviders: [],
      };
    });

    return {
      posts: transformedPosts,
      total: totalResult[0]?.count || 0,
    };
  },

  saveIncomingPost: async (
    post: {
      content: ContentType[];
      alternativeContent?: {
        socialProvider: { socialId: string };
        content: ContentType[];
      }[];
    },
    postStatus: Post['status'],
    userId?: string,
    organizationId?: string
  ) => {
    return await database.transaction(async (tx) => {
      // Create the main post
      const [createdPost] = await tx
        .insert(posts)
        .values({
          content: post.content as PostInsert['content'],
          status: postStatus,
          userId: userId ?? null,
          organizationId: organizationId ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Create alternate contents if any
      if (post.alternativeContent && post.alternativeContent.length > 0) {
        await tx.insert(alternatePostContent).values(
          post.alternativeContent.map((alt) => ({
            postId: createdPost.id,
            socialProviderId: alt.socialProvider.socialId,
            content: alt.content as PostInsert['content'],
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        );
      }

      return createdPost;
    });
  },

  updatePostContent: async (
    postId: string,
    content: ContentType[],
    alternativeContent?: {
      socialProvider: { socialId: string };
      content: ContentType[];
    }[]
  ) => {
    return await database.transaction(async (tx) => {
      // Update the main post
      const [post] = await tx
        .update(posts)
        .set({
          content: content,
        })
        .where(eq(posts.id, postId))
        .returning();

      // Handle alternate contents - delete existing ones first
      await tx
        .delete(alternatePostContent)
        .where(eq(alternatePostContent.postId, postId));

      // Insert new alternate contents
      if (alternativeContent && alternativeContent.length > 0) {
        await tx.insert(alternatePostContent).values(
          alternativeContent.map((alt) => ({
            postId,
            socialProviderId: alt.socialProvider.socialId,
            content: alt.content as PostInsert['content'],
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        );
      }

      return post;
    });
  },

  softDeletePost: async (id: string) => {
    const [post] = await database
      .update(posts)
      .set({
        isDeleted: true,
        status: 'DELETED',
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning();
    return post;
  },

  getScheduledPosts: async (
    filters: PostFilters = {},
    pagination?: { skip?: number; take?: number }
  ) => {
    const whereConditions = [
      eq(posts.status, 'SCHEDULED'),
      gt(posts.scheduledAt, new Date()),
    ];

    const filterConditions = buildWhereClause(filters);
    if (filterConditions) {
      whereConditions.push(filterConditions);
    }

    const whereClause = and(...whereConditions);

    const [scheduledPosts, totalResult] = await Promise.all([
      database
        .select()
        .from(posts)
        .where(whereClause)
        .orderBy(asc(posts.scheduledAt))
        .limit(pagination?.take || 50)
        .offset(pagination?.skip || 0),
      database.select({ count: count() }).from(posts).where(whereClause),
    ]);

    return {
      posts: scheduledPosts,
      total: totalResult[0]?.count || 0,
    };
  },

  // Post queries
  getUserPosts: (userId: string) => {
    return database
      .select()
      .from(posts)
      .where(and(eq(posts.userId, userId), eq(posts.isDeleted, false)))
      .orderBy(desc(posts.createdAt));
  },

  getPostsByStatus: (
    status: 'SAVED' | 'PUBLISHED' | 'SCHEDULED' | 'DELETED' | 'FAILED'
  ) => {
    return database
      .select()
      .from(posts)
      .where(eq(posts.status, status))
      .orderBy(desc(posts.createdAt));
  },

  createPost: (postData: typeof posts.$inferInsert) => {
    return database.insert(posts).values(postData).returning();
  },

  updatePost: (id: string, postData: Partial<typeof posts.$inferInsert>) => {
    return database
      .update(posts)
      .set(postData)
      .where(eq(posts.id, id))
      .returning();
  },

  deletePost: (id: string) => {
    return database
      .update(posts)
      .set({ isDeleted: true })
      .where(eq(posts.id, id))
      .returning();
  },

  hardDeletePost: (id: string) => {
    return database.delete(posts).where(eq(posts.id, id));
  },

  // Alternate Content queries
  getAlternateContent: (postId: string, socialProviderId: string) => {
    return database
      .select()
      .from(alternatePostContent)
      .where(
        and(
          eq(alternatePostContent.postId, postId),
          eq(alternatePostContent.socialProviderId, socialProviderId)
        )
      )
      .limit(1);
  },

  getPostAlternateContents: (postId: string) => {
    return database
      .select()
      .from(alternatePostContent)
      .where(eq(alternatePostContent.postId, postId));
  },

  createAlternateContent: (
    contentData: typeof alternatePostContent.$inferInsert
  ) => {
    return database
      .insert(alternatePostContent)
      .values(contentData)
      .returning();
  },

  updateAlternateContent: (
    postId: string,
    socialProviderId: string,
    content: import('@delulu/validators/post').ContentType[]
  ) => {
    return database
      .update(alternatePostContent)
      .set({ content })
      .where(
        and(
          eq(alternatePostContent.postId, postId),
          eq(alternatePostContent.socialProviderId, socialProviderId)
        )
      )
      .returning();
  },

  deleteAlternateContent: (postId: string, socialProviderId: string) => {
    return database
      .delete(alternatePostContent)
      .where(
        and(
          eq(alternatePostContent.postId, postId),
          eq(alternatePostContent.socialProviderId, socialProviderId)
        )
      );
  },

  // Platform Posts queries
  getPlatformPostById: (postId: string, platformId: string) => {
    return database
      .select()
      .from(platformPosts)
      .where(
        and(
          eq(platformPosts.postId, postId),
          eq(platformPosts.platformId, platformId)
        )
      )
      .limit(1);
  },

  getPostPlatformPosts: (postId: string) => {
    return database
      .select()
      .from(platformPosts)
      .where(eq(platformPosts.postId, postId));
  },

  createPlatformPost: (platformPostData: typeof platformPosts.$inferInsert) => {
    return database.insert(platformPosts).values(platformPostData).returning();
  },

  deletePostPlatformPosts: (postId: string) => {
    return database
      .delete(platformPosts)
      .where(eq(platformPosts.postId, postId));
  },
};
