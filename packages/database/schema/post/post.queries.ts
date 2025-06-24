import { and, asc, desc, eq, lte } from 'drizzle-orm';
import { database } from '../../index';
import { alternatePostContent, platformPosts, posts } from './post.sql';

export const postQueries = {
  // Post queries
  getPostById: (id: string) => {
    return database.select().from(posts).where(eq(posts.id, id)).limit(1);
  },

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

  getScheduledPosts: (before?: Date) => {
    const conditions = [eq(posts.status, 'SCHEDULED')];
    if (before) {
      conditions.push(lte(posts.scheduledAt, before));
    }
    return database
      .select()
      .from(posts)
      .where(and(...conditions))
      .orderBy(asc(posts.scheduledAt));
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
