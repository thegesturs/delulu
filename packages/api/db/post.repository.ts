import { database } from '@delulu/database';
import {
  type PostReviewStatus,
  PostStatus,
  type Prisma,
  type PrivacyStatus,
} from '@delulu/database';

// Types for filters
export type PostFilters = {
  status?: PostStatus;
  privacyStatus?: PrivacyStatus;
  reviewStatus?: PostReviewStatus;
  organizationId?: string;
  isDeleted?: boolean;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
};

// Helper function to build where clause
function buildWhereClause(filters: PostFilters = {}) {
  const where: Prisma.PostWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.privacyStatus) {
    where.privacyStatus = filters.privacyStatus;
  }
  if (filters.reviewStatus) {
    where.reviewStatus = filters.reviewStatus;
  }
  if (filters.organizationId) {
    where.organizationId = filters.organizationId;
  }
  if (filters.isDeleted !== undefined) {
    where.isDeleted = filters.isDeleted;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {
      ...(filters.startDate && { gte: filters.startDate }),
      ...(filters.endDate && { lte: filters.endDate }),
    };
  }

  if (filters.searchTerm) {
    where.OR = [
      { content: { path: ['$[*].text'], string_contains: filters.searchTerm } },
    ];
  }

  return where;
}

// Get a single post by ID
export async function getPostById(
  postId: string,
  include?: Prisma.PostInclude
) {
  return await database.post.findUnique({
    where: { id: postId },
    include: {
      socialProviders: true,
      ...include,
    },
  });
}

// Get posts by user ID with filters
export async function getPostsByUserId(
  userId: string,
  filters: PostFilters = {},
  pagination?: { skip?: number; take?: number },
  include?: Prisma.PostInclude
) {
  const where = {
    userId,
    ...buildWhereClause(filters),
  };

  const [posts, total] = await Promise.all([
    database.post.findMany({
      where,
      include: {
        socialProviders: true,
        ...include,
      },
      orderBy: { createdAt: 'desc' },
      ...pagination,
    }),
    database.post.count({ where }),
  ]);

  return {
    posts,
    total,
  };
}

// Save a new post
export async function savePost(
  data: Prisma.PostCreateInput,
  include?: Prisma.PostInclude
) {
  return await database.post.create({
    data,
    include: {
      ...include,
    },
  });
}

// Update an existing post
export async function updatePost(
  postId: string,
  data: Prisma.PostUpdateInput,
  include?: Prisma.PostInclude
) {
  return await database.post.update({
    where: { id: postId },
    data,
    include: {
      ...include,
    },
  });
}

// Soft delete a post
export async function softDeletePost(postId: string) {
  return await database.post.update({
    where: { id: postId },
    data: {
      isDeleted: true,
      status: PostStatus.DELETED,
    },
  });
}

// Hard delete a post
export async function hardDeletePost(postId: string) {
  return await database.post.delete({
    where: { id: postId },
  });
}

// Get scheduled posts
export async function getScheduledPosts(
  filters: PostFilters = {},
  pagination?: { skip?: number; take?: number }
) {
  const where = {
    status: PostStatus.SCHEDULED,
    scheduledAt: { gt: new Date() },
    ...buildWhereClause(filters),
  };

  const [posts, total] = await Promise.all([
    database.post.findMany({
      where,
      include: {
        user: true,
        organization: true,
        socialProviders: true,
        alternateContents: true,
        platformPosts: true,
      },
      orderBy: { scheduledAt: 'asc' },
      ...pagination,
    }),
    database.post.count({ where }),
  ]);

  return {
    posts,
    total,
  };
}
