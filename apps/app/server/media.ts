'use server';

import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import type {
  CreateMediaInput,
  MediaItem,
  MediaQueryParams,
  MediaQueryResult,
  UpdateMediaInput,
} from './types';
import { validateRequired, withAuth } from './utils';

// Get user's media with pagination and filtering
export const getUserMedia = withAuth(
  async (userId: string, params: MediaQueryParams = {}): Promise<MediaQueryResult> => {
    const { limit = 20, cursor = 0, mediaType, search } = params;
    
    // Validate limit
    if (limit < 1 || limit > 50) {
      throw new Error('Limit must be between 1 and 50');
    }

    const media = await fetchQuery(api.media.getMediaByUserId, {
      userId: userId as Id<'users'>,
      limit: limit + 1, // Fetch one extra to determine if there are more
      offset: cursor,
      mediaType,
    });

    // Filter by search if provided
    const filteredMedia = search
      ? media.filter(
          (item) =>
            item.originalFilename
              ?.toLowerCase()
              .includes(search.toLowerCase()) ||
            item.altText?.toLowerCase().includes(search.toLowerCase())
        )
      : media;

    const hasMore = filteredMedia.length > limit;
    const actualMedia = hasMore
      ? filteredMedia.slice(0, limit)
      : filteredMedia;

    return {
      media: actualMedia,
      hasMore,
      nextCursor: hasMore ? cursor + limit : undefined,
    };
  }
);

// Get media by ID
export const getMediaById = withAuth(
  async (userId: string, id: string): Promise<MediaItem> => {
    validateRequired(id, 'Media ID');

    const media = await fetchQuery(api.media.getMediaById, {
      id: id as Id<'media'>,
    });

    if (!media || media.userId !== (userId as Id<'users'>)) {
      throw new Error('Media not found');
    }

    return media;
  }
);

// Get media by bucket key
export const getMediaByBucketKey = withAuth(
  async (userId: string, bucketKey: string): Promise<MediaItem> => {
    validateRequired(bucketKey, 'Bucket key');

    const media = await fetchQuery(api.media.getMediaByBucketKey, {
      bucketKey,
    });

    if (!media || media.userId !== (userId as Id<'users'>)) {
      throw new Error('Media not found');
    }

    return media;
  }
);

// Create media record
export const createMedia = withAuth(
  async (userId: string, input: CreateMediaInput) => {
    validateRequired(input.bucketKey, 'Bucket key');
    validateRequired(input.url, 'URL');
    validateRequired(input.mediaType, 'Media type');

    return await fetchMutation(api.media.createMedia, {
      ...input,
      userId: userId as Id<'users'>,
    });
  }
);

// Update media
export const updateMedia = withAuth(
  async (userId: string, input: UpdateMediaInput) => {
    validateRequired(input.id, 'Media ID');
    
    const { id, ...updates } = input;

    // Verify ownership
    const existingMedia = await fetchQuery(api.media.getMediaById, {
      id: id as Id<'media'>,
    });

    if (!existingMedia || existingMedia.userId !== (userId as Id<'users'>)) {
      throw new Error('Media not found');
    }

    return await fetchMutation(api.media.updateMedia, {
      id: id as Id<'media'>,
      ...updates,
    });
  }
);

// Delete media
export const deleteMedia = withAuth(
  async (userId: string, id: string) => {
    validateRequired(id, 'Media ID');

    // Verify ownership
    const existingMedia = await fetchQuery(api.media.getMediaById, {
      id: id as Id<'media'>,
    });

    if (!existingMedia || existingMedia.userId !== (userId as Id<'users'>)) {
      throw new Error('Media not found');
    }

    await fetchMutation(api.media.deleteMedia, {
      id: id as Id<'media'>,
    });
  }
);

// Get media stats
export const getMediaStats = withAuth(
  async (userId: string) => {
    return await fetchQuery(api.media.getMediaStats, {
      userId: userId as Id<'users'>,
    });
  }
);