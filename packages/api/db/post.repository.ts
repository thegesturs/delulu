import {
  alternatePostContent,
  and,
  asc,
  count,
  database,
  desc,
  eq,
  gt,
  gte,
  lt,
  lte,
  platformPosts,
  posts,
  sql,
  users,
} from '@delulu/database';
import type {
  SavePostInputType,
  UpdatePostInput,
} from '@delulu/validators/post';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import type { ApiPost, PaginatedPostsResponse } from './types/post.types';
import { ApiPostContentItemSchema } from './types/post.types';

// Types for filters
export type PostFilters = {
  status?: 'SAVED' | 'PUBLISHED' | 'SCHEDULED' | 'DELETED' | 'FAILED';
  privacyStatus?: 'PUBLIC' | 'PRIVATE';
  reviewStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
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
    // Use JSON contains for searching in content
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

// Get a single post by ID
export async function getPostById(postId: string) {
  const [post] = await database.query.posts.findMany({
    where: (posts, { eq }) => eq(posts.id, postId),
    limit: 1,
    with: {
      alternateContents: {
        with: {
          socialProvider: true,
        },
      },
    },
  });

  return post || null;
}

// Get posts by user ID with filters
export async function getPostsByUserId(
  userId: string,
  filters: PostFilters = {},
  pagination?: { skip?: number; take?: number }
): Promise<PaginatedPostsResponse> {
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

  const transformedPosts: ApiPost[] = databasePosts.map((post) => {
    // Validate and transform content
    const parsedContent = z
      .array(ApiPostContentItemSchema)
      .safeParse(post.content);
    return {
      ...post,
      content: parsedContent.success ? parsedContent.data : [],
      status: post.status,
      privacyStatus: post.privacyStatus,
      reviewStatus: post.reviewStatus,
      socialProviders: [],
      platformPosts: [],
    };
  });

  return {
    posts: transformedPosts,
    total: totalResult[0]?.count || 0,
  };
}

// Save a new post
export async function savePost(data: typeof posts.$inferInsert) {
  const [post] = await database.insert(posts).values(data).returning();
  return post;
}

export async function saveIncomingPost(
  post: SavePostInputType,
  postStatus: 'SAVED' | 'PUBLISHED' | 'SCHEDULED' | 'DELETED' | 'FAILED',
  userId?: string,
  organizationId?: string
) {
  const postId = `post_${nanoid(12)}`;

  // Create the main post
  const [createdPost] = await database
    .insert(posts)
    .values({
      id: postId,
      content: post.content,
      status: postStatus,
      userId: userId ?? null,
      organizationId: organizationId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // Create alternate contents if any
  if (post.alternativeContent?.length > 0) {
    await database.insert(alternatePostContent).values(
      post.alternativeContent.map((alt) => ({
        postId,
        socialProviderId: alt.socialProvider.socialId,
        content: alt.content,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );
  }

  return createdPost;
}

// Update an existing post
export async function updatePost(
  postId: string,
  data: Partial<typeof posts.$inferInsert>
) {
  const [post] = await database
    .update(posts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(posts.id, postId))
    .returning();
  return post;
}

export async function updatePostContent(updatePostInput: UpdatePostInput) {
  // Update the main post
  const [post] = await database
    .update(posts)
    .set({
      content: updatePostInput.content,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, updatePostInput.postId))
    .returning();

  // Handle alternate contents - delete existing ones first
  await database
    .delete(alternatePostContent)
    .where(eq(alternatePostContent.postId, updatePostInput.postId));

  // Insert new alternate contents
  if (updatePostInput.alternativeContent?.length > 0) {
    await database.insert(alternatePostContent).values(
      updatePostInput.alternativeContent.map((alt) => ({
        postId: updatePostInput.postId,
        socialProviderId: alt.socialProvider.socialId,
        content: alt.content,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );
  }

  return post;
}

// Soft delete a post
export async function softDeletePost(postId: string) {
  const [post] = await database
    .update(posts)
    .set({
      isDeleted: true,
      status: 'DELETED',
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId))
    .returning();
  return post;
}

// Hard delete a post
export async function hardDeletePost(postId: string) {
  // Delete related alternate contents first
  await database
    .delete(alternatePostContent)
    .where(eq(alternatePostContent.postId, postId));

  // Delete related platform posts
  await database.delete(platformPosts).where(eq(platformPosts.postId, postId));

  // Delete the post
  return await database.delete(posts).where(eq(posts.id, postId));
}

// Get scheduled posts
export async function getScheduledPosts(
  filters: PostFilters = {},
  pagination?: { skip?: number; take?: number }
) {
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
      .select({
        id: posts.id,
        content: posts.content,
        status: posts.status,
        privacyStatus: posts.privacyStatus,
        reviewStatus: posts.reviewStatus,
        scheduledAt: posts.scheduledAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        userId: posts.userId,
        organizationId: posts.organizationId,
        isDeleted: posts.isDeleted,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
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
}
