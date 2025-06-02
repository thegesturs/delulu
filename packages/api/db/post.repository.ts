import { database } from '@delulu/database';
import type { Prisma } from '@delulu/database';
import {
  type PostReviewStatus,
  PostStatus,
  type PrivacyStatus,
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
  status?: PostStatus;
  privacyStatus?: PrivacyStatus;
  reviewStatus?: PostReviewStatus;
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

  if (filters.startDate) {
    if (typeof where.createdAt === 'object' && where.createdAt !== null) {
      (where.createdAt as Prisma.DateTimeFilter).gte = filters.startDate;
    } else {
      where.createdAt = { gte: filters.startDate };
    }
  }
  if (filters.endDate) {
    if (typeof where.createdAt === 'object' && where.createdAt !== null) {
      (where.createdAt as Prisma.DateTimeFilter).lte = filters.endDate;
    } else {
      where.createdAt = { lte: filters.endDate };
    }
  }

  if (filters.searchTerm) {
    where.OR = [
      { content: { path: ['$[*].text'], string_contains: filters.searchTerm } },
    ];
  }

  if (typeof filters.hasSocialProviders === 'boolean') {
    if (filters.hasSocialProviders) {
      where.socialProviders = { some: {} };
    } else {
      where.socialProviders = { none: {} };
    }
  }

  if (filters.scheduledBefore) {
    if (typeof where.scheduledAt === 'object' && where.scheduledAt !== null) {
      (where.scheduledAt as Prisma.DateTimeNullableFilter).lt =
        filters.scheduledBefore;
    } else {
      where.scheduledAt = { lt: filters.scheduledBefore };
    }
  }

  if (filters.scheduledAfter) {
    if (typeof where.scheduledAt === 'object' && where.scheduledAt !== null) {
      (where.scheduledAt as Prisma.DateTimeNullableFilter).gt =
        filters.scheduledAfter;
    } else {
      where.scheduledAt = { gt: filters.scheduledAfter };
    }
  }

  return where;
}

// Get a single post by ID
export async function getPostById(postId: string) {
  return await database.post.findUnique({
    where: { id: postId },
    include: {
      socialProviders: true,
      alternateContents: {
        include: {
          socialProvider: {
            select: {
              id: true,
              fullName: true,
              socialType: true,
            },
          },
        },
      },
    },
  });
}

// Get posts by user ID with filters
export async function getPostsByUserId(
  userId: string,
  filters: PostFilters = {},
  pagination?: { skip?: number; take?: number },
  include?: Prisma.PostInclude
): Promise<PaginatedPostsResponse> {
  const where = {
    userId,
    ...buildWhereClause(filters),
  };

  const [dbPosts, total] = await Promise.all([
    database.post.findMany({
      where,
      include: {
        socialProviders: true,
        platformPosts: true,
        ...include,
      },
      orderBy: { createdAt: 'desc' },
      ...pagination,
    }),
    database.post.count({ where }),
  ]);

  console.log(dbPosts, 'posts');

  const posts: ApiPost[] = dbPosts.map((post) => {
    // Validate and transform content
    const parsedContent = z
      .array(ApiPostContentItemSchema)
      .safeParse(post.content);
    return {
      ...post,
      content: parsedContent.success ? parsedContent.data : [], // Default to empty array if parsing fails or content is null/invalid
      // Ensure other fields match ApiPost if necessary, though Prisma types should align for most
      // For example, explicitly map status if it's not already the correct enum string
      status: post.status as PostStatus,
      privacyStatus: post.privacyStatus as PrivacyStatus,
      reviewStatus: post.reviewStatus as PostReviewStatus,
      // Map other potentially problematic fields here if they arise
    };
  });

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

export async function saveIncomingPost(
  post: SavePostInputType,
  postStatus: PostStatus,
  userId?: string,
  organizationId?: string
) {
  return await database.post.create({
    data: {
      content: post.content,
      status: postStatus,
      id: `post_${nanoid(12)}`,
      socialProviders: {
        connect: post.socialProviders.map((provider) => ({
          id: provider.socialId,
        })),
      },
      userId: userId ?? undefined,
      organizationId: organizationId ?? undefined,
      alternateContents: {
        create: post.alternativeContent.map((alt) => ({
          content: alt.content,
          socialProviderId: alt.socialProvider.socialId,
        })),
      },
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

export async function updatePostContent(updatePostInput: UpdatePostInput) {
  return await database.post.update({
    where: { id: updatePostInput.postId },
    data: {
      content: updatePostInput.content,
      socialProviders: {
        // Replace all providers with the new set
        set: updatePostInput.socialProviders.map((provider) => ({
          id: provider.socialId,
        })),
      },
      alternateContents: {
        // Delete all alternate contents that are not in the input
        deleteMany: {
          postId: updatePostInput.postId,
          NOT: {
            socialProviderId: {
              in: updatePostInput.alternativeContent.map(
                (alt) => alt.socialProvider.socialId
              ),
            },
          },
        },
        // Update existing or create new ones
        upsert: updatePostInput.alternativeContent.map((alt) => ({
          where: {
            postId_socialProviderId: {
              postId: updatePostInput.postId,
              socialProviderId: alt.socialProvider.socialId,
            },
          },
          update: {
            content: alt.content,
          },
          create: {
            content: alt.content,
            socialProviderId: alt.socialProvider.socialId,
          },
        })),
      },
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
