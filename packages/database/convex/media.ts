import { v } from 'convex/values';
import type { Doc } from './_generated/dataModel';
import { internalMutation, mutation, query } from './_generated/server';
import {
  mediaCreateSchema,
  mediaFiltersSchema,
  mediaStatsSchema,
  mediaTableSchema,
  mediaUpdateSchema,
  searchFiltersSchema,
} from './schemas';
import { getCurrentTimestamp, isValidUrl } from './utils';

// Media queries
export const getMediaById = query({
  args: { id: v.id('media') },
  returns: v.union(mediaTableSchema, v.null()),
  handler: async (ctx, args) => {
    const media = await ctx.db
      .query('media')
      .withIndex('by_id', (q) => q.eq('_id', args.id))
      .unique();

    return media;
  },
});

export const getMediaByUserId = query({
  args: {
    userId: v.id('users'),
    ...mediaFiltersSchema.fields,
  },
  returns: v.array(mediaTableSchema),
  handler: async (ctx, args) => {
    const allMedia = await ctx.db
      .query('media')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .collect();

    // Filter by media type if specified
    let filteredMedia = allMedia;
    if (args.mediaType) {
      filteredMedia = allMedia.filter(
        (media) => media.mediaType === args.mediaType
      );
    }

    // Sort by creation date (newest first)
    filteredMedia.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;

    return filteredMedia.slice(offset, offset + limit);
  },
});

export const getMediaByBucketKey = query({
  args: { bucketKey: v.string() },
  returns: v.union(mediaTableSchema, v.null()),
  handler: async (ctx, args) => {
    const media = await ctx.db
      .query('media')
      .withIndex('by_bucket_key', (q) => q.eq('bucketKey', args.bucketKey))
      .unique();

    return media;
  },
});

export const createMedia = mutation({
  args: mediaCreateSchema.fields,
  returns: v.id('media'),
  handler: async (ctx, args) => {
    // Validate URL
    if (!isValidUrl(args.url)) {
      throw new Error('Invalid media URL');
    }

    // Validate bucket URLs if provided
    if (args.bucketUrl && !isValidUrl(args.bucketUrl)) {
      throw new Error('Invalid bucket URL');
    }

    if (args.thumbnailBucketUrl && !isValidUrl(args.thumbnailBucketUrl)) {
      throw new Error('Invalid thumbnail bucket URL');
    }

    const now = getCurrentTimestamp();

    const newMediaId = await ctx.db.insert('media', {
      userId: args.userId,
      organizationId: args.organizationId,
      bucketKey: args.bucketKey,
      url: args.url,
      mediaType: args.mediaType,
      originalFilename: args.originalFilename,
      size: args.size,
      extension: args.extension,
      altText: args.altText,
      bucketUrl: args.bucketUrl,
      thumbnailBucketUrl: args.thumbnailBucketUrl,
      thumbnailBucketKey: args.thumbnailBucketKey,
      createdAt: now,
      updatedAt: now,
    });

    return newMediaId;
  },
});

export const updateMedia = mutation({
  args: {
    id: v.id('media'),
    ...mediaUpdateSchema.fields,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const media = await ctx.db
      .query('media')
      .withIndex('by_id', (q) => q.eq('_id', args.id))
      .unique();

    if (!media) {
      throw new Error('Media not found');
    }

    // Validate URLs if provided
    if (args.url && !isValidUrl(args.url)) {
      throw new Error('Invalid media URL');
    }

    if (args.bucketUrl && !isValidUrl(args.bucketUrl)) {
      throw new Error('Invalid bucket URL');
    }

    if (args.thumbnailBucketUrl && !isValidUrl(args.thumbnailBucketUrl)) {
      throw new Error('Invalid thumbnail bucket URL');
    }

    const updateData: Partial<Doc<'media'>> = {
      updatedAt: getCurrentTimestamp(),
    };

    if (args.url !== undefined) updateData.url = args.url;
    if (args.originalFilename !== undefined)
      updateData.originalFilename = args.originalFilename;
    if (args.size !== undefined) updateData.size = args.size;
    if (args.extension !== undefined) updateData.extension = args.extension;
    if (args.altText !== undefined) updateData.altText = args.altText;
    if (args.bucketUrl !== undefined) updateData.bucketUrl = args.bucketUrl;
    if (args.thumbnailBucketUrl !== undefined)
      updateData.thumbnailBucketUrl = args.thumbnailBucketUrl;
    if (args.thumbnailBucketKey !== undefined)
      updateData.thumbnailBucketKey = args.thumbnailBucketKey;

    await ctx.db.patch(media._id, updateData);

    return true;
  },
});

export const deleteMedia = mutation({
  args: { id: v.id('media') },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const media = await ctx.db
      .query('media')
      .withIndex('by_id', (q) => q.eq('_id', args.id))
      .unique();

    if (!media) {
      throw new Error('Media not found');
    }

    await ctx.db.delete(media._id);

    return true;
  },
});

export const getMediaStats = query({
  args: { userId: v.id('users') },
  returns: mediaStatsSchema,
  handler: async (ctx, args) => {
    const userMedia = await ctx.db
      .query('media')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .collect();

    const stats = {
      totalCount: userMedia.length,
      imageCount: 0,
      videoCount: 0,
      totalSize: 0,
    };

    for (const media of userMedia) {
      if (media.mediaType === 'IMAGE') {
        stats.imageCount++;
      } else if (media.mediaType === 'VIDEO') {
        stats.videoCount++;
      }

      if (media.size) {
        stats.totalSize += media.size;
      }
    }

    return stats;
  },
});

export const getOrganizationMediaStats = query({
  args: { organizationId: v.string() },
  returns: mediaStatsSchema,
  handler: async (ctx, args) => {
    const orgMedia = await ctx.db
      .query('media')
      .withIndex('by_organization_id', (q) =>
        q.eq('organizationId', args.organizationId)
      )
      .collect();

    const stats = {
      totalCount: orgMedia.length,
      imageCount: 0,
      videoCount: 0,
      totalSize: 0,
    };

    for (const media of orgMedia) {
      if (media.mediaType === 'IMAGE') {
        stats.imageCount++;
      } else if (media.mediaType === 'VIDEO') {
        stats.videoCount++;
      }

      if (media.size) {
        stats.totalSize += media.size;
      }
    }

    return stats;
  },
});

export const searchMedia = query({
  args: searchFiltersSchema.fields,
  returns: v.array(mediaTableSchema),
  handler: async (ctx, args) => {
    let mediaItems: Doc<'media'>[];

    const userId = args.userId;
    const organizationId = args.organizationId;

    if (userId) {
      mediaItems = await ctx.db
        .query('media')
        .withIndex('by_user_id', (q) => q.eq('userId', userId))
        .collect();
    } else if (organizationId) {
      mediaItems = await ctx.db
        .query('media')
        .withIndex('by_organization_id', (q) =>
          q.eq('organizationId', args.organizationId)
        )
        .collect();
    } else {
      // Search all media if no user or organization specified
      mediaItems = await ctx.db.query('media').collect();
    }

    // Filter by search term (search in filename, alt text, and extension)
    const searchTermLower = args.searchTerm.toLowerCase();
    let filteredMedia = mediaItems.filter((media) => {
      const filename = media.originalFilename?.toLowerCase() || '';
      const altText = media.altText?.toLowerCase() || '';
      const extension = media.extension?.toLowerCase() || '';

      return (
        filename.includes(searchTermLower) ||
        altText.includes(searchTermLower) ||
        extension.includes(searchTermLower)
      );
    });

    // Filter by media type if specified
    if (args.mediaType) {
      filteredMedia = filteredMedia.filter(
        (media) => media.mediaType === args.mediaType
      );
    }

    // Sort by creation date (newest first)
    filteredMedia.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;

    return filteredMedia.slice(offset, offset + limit);
  },
});

export const getRecentMedia = query({
  args: {
    userId: v.optional(v.id('users')),
    organizationId: v.optional(v.id('organizations')),
    limit: v.optional(v.number()),
  },
  returns: v.array(mediaTableSchema),
  handler: async (ctx, args) => {
    let mediaItems: Doc<'media'>[];

    const userId = args.userId;
    const organizationId = args.organizationId;

    if (userId) {
      mediaItems = await ctx.db
        .query('media')
        .withIndex('by_user_id', (q) => q.eq('userId', userId))
        .collect();
    } else if (organizationId) {
      mediaItems = await ctx.db
        .query('media')
        .withIndex('by_organization_id', (q) =>
          q.eq('organizationId', organizationId)
        )
        .collect();
    } else {
      // Get all media if no user or organization specified
      mediaItems = await ctx.db.query('media').collect();
    }

    // Sort by creation date (newest first)
    mediaItems.sort((a, b) => b.createdAt - a.createdAt);

    // Apply limit
    const limit = args.limit || 20;

    return mediaItems.slice(0, limit);
  },
});

export const bulkDeleteMedia = mutation({
  args: { ids: v.array(v.id('media')) },
  returns: v.number(),
  handler: async (ctx, args) => {
    let deletedCount = 0;

    for (const id of args.ids) {
      const media = await ctx.db
        .query('media')
        .withIndex('by_id', (q) => q.eq('_id', id))
        .unique();

      if (media) {
        await ctx.db.delete(media._id);
        deletedCount++;
      }
    }

    return deletedCount;
  },
});

// Internal function to clean up media for deleted users
export const cleanupMediaForDeletedUser = internalMutation({
  args: { userId: v.id('users') },
  returns: v.number(),
  handler: async (ctx, args) => {
    const userMedia = await ctx.db
      .query('media')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .collect();

    for (const media of userMedia) {
      await ctx.db.delete(media._id);
    }

    return userMedia.length;
  },
});

// Internal function to clean up media for deleted organizations
export const cleanupMediaForDeletedOrganization = internalMutation({
  args: { organizationId: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    const orgMedia = await ctx.db
      .query('media')
      .withIndex('by_organization_id', (q) =>
        q.eq('organizationId', args.organizationId)
      )
      .collect();

    for (const media of orgMedia) {
      await ctx.db.delete(media._id);
    }

    return orgMedia.length;
  },
});
