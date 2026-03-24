import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";
import { getAuthContext } from "./lib/auth";
import {
  adjustUsage,
  getUsageOwnerId,
  resolveUsageOwnerFromDoc,
} from "./lib/usage";
import {
  mediaCreateSchema,
  mediaFiltersSchema,
  mediaStatsSchema,
  mediaTableSchema,
  mediaUpdateSchema,
  searchFiltersSchema,
} from "./schemas";
import { getCurrentUser } from "./users";
import { getCurrentTimestamp, isValidUrl } from "./utils";

// Media queries
export const getMediaById = query({
  args: { id: v.id("media") },
  returns: v.union(mediaTableSchema, v.null()),
  handler: async (ctx, args) => {
    const media = await ctx.db
      .query("media")
      .withIndex("by_id", (q) => q.eq("_id", args.id))
      .unique();

    return media;
  },
});

export const getMedia = query({
  args: {
    ...mediaFiltersSchema.fields,
  },
  returns: v.object({
    media: v.array(mediaTableSchema),
    nextCursor: v.union(v.number(), v.null()),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const authCtx = await getAuthContext(ctx);

    if (!authCtx) {
      throw new Error("User not found");
    }

    const limit = Math.min(args.limit ?? 50, 100); // Cap at 100 per page

    // In org context, query by org; in personal, query by user
    // biome-ignore lint/suspicious/noImplicitAnyLet: query type inferred from branches
    let query;
    if (authCtx.organizationId) {
      query = ctx.db
        .query("media")
        .withIndex("by_organization_id", (q) =>
          q.eq("organizationId", authCtx.organizationId)
        )
        .order("desc");
    } else {
      query = ctx.db
        .query("media")
        .withIndex("by_userId_createdAt", (q) =>
          args.cursor
            ? q.eq("userId", authCtx.userId).lt("createdAt", args.cursor)
            : q.eq("userId", authCtx.userId)
        )
        .order("desc");
    }

    // Apply mediaType filter at database level if specified
    if (args.mediaType) {
      query = query.filter((q) => q.eq(q.field("mediaType"), args.mediaType));
    }

    // Fetch limit + 1 to determine hasMore
    const results = await query.take(limit + 1);

    // Separate actual results from hasMore indicator
    const media = results.slice(0, limit);
    const hasMore = results.length > limit;
    const nextCursor =
      hasMore && media.length > 0 ? (media.at(-1)?.createdAt ?? null) : null;

    return {
      media,
      nextCursor,
      hasMore,
    };
  },
});

export const getMediaByBucketKey = query({
  args: { bucketKey: v.string() },
  returns: v.union(mediaTableSchema, v.null()),
  handler: async (ctx, args) => {
    const media = await ctx.db
      .query("media")
      .withIndex("by_bucket_key", (q) => q.eq("bucketKey", args.bucketKey))
      .unique();

    return media;
  },
});

export const createMedia = mutation({
  args: mediaCreateSchema.fields,
  returns: v.id("media"),
  handler: async (ctx, args) => {
    // Validate URL
    if (!isValidUrl(args.url)) {
      throw new Error("Invalid media URL");
    }

    // Validate bucket URLs if provided
    if (args.bucketUrl && !isValidUrl(args.bucketUrl)) {
      throw new Error("Invalid bucket URL");
    }

    if (args.thumbnailBucketUrl && !isValidUrl(args.thumbnailBucketUrl)) {
      throw new Error("Invalid thumbnail bucket URL");
    }

    const now = getCurrentTimestamp();

    const authCtx = await getAuthContext(ctx);

    if (!authCtx) {
      throw new Error("User not found");
    }

    const newMediaId = await ctx.db.insert("media", {
      userId: authCtx.userId,
      organizationId: authCtx.organizationId ?? args.organizationId,
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

    // Increment media storage counter
    if (args.size) {
      const ownerId = await getUsageOwnerId(ctx, authCtx);
      await adjustUsage(ctx, ownerId, "mediaStorageBytes", args.size);
    }

    return newMediaId;
  },
});

export const updateMedia = mutation({
  args: {
    id: v.id("media"),
    ...mediaUpdateSchema.fields,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const media = await ctx.db
      .query("media")
      .withIndex("by_id", (q) => q.eq("_id", args.id))
      .unique();

    if (!media) {
      throw new Error("Media not found");
    }

    // Validate URLs if provided
    if (args.url && !isValidUrl(args.url)) {
      throw new Error("Invalid media URL");
    }

    if (args.bucketUrl && !isValidUrl(args.bucketUrl)) {
      throw new Error("Invalid bucket URL");
    }

    if (args.thumbnailBucketUrl && !isValidUrl(args.thumbnailBucketUrl)) {
      throw new Error("Invalid thumbnail bucket URL");
    }

    const updateData: Partial<Doc<"media">> = {
      updatedAt: getCurrentTimestamp(),
    };

    if (args.url !== undefined) {
      updateData.url = args.url;
    }
    if (args.originalFilename !== undefined) {
      updateData.originalFilename = args.originalFilename;
    }
    if (args.size !== undefined) {
      updateData.size = args.size;
    }
    if (args.extension !== undefined) {
      updateData.extension = args.extension;
    }
    if (args.altText !== undefined) {
      updateData.altText = args.altText;
    }
    if (args.bucketUrl !== undefined) {
      updateData.bucketUrl = args.bucketUrl;
    }
    if (args.thumbnailBucketUrl !== undefined) {
      updateData.thumbnailBucketUrl = args.thumbnailBucketUrl;
    }
    if (args.thumbnailBucketKey !== undefined) {
      updateData.thumbnailBucketKey = args.thumbnailBucketKey;
    }

    await ctx.db.patch(media._id, updateData);

    return true;
  },
});

export const deleteMedia = mutation({
  args: { id: v.id("media") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const media = await ctx.db
      .query("media")
      .withIndex("by_id", (q) => q.eq("_id", args.id))
      .unique();

    if (!media) {
      throw new Error("Media not found");
    }

    // Decrement media storage counter
    if (media.size) {
      const ownerId = await resolveUsageOwnerFromDoc(ctx, media);
      await adjustUsage(ctx, ownerId, "mediaStorageBytes", -media.size);
    }

    await ctx.db.delete(media._id);

    return true;
  },
});

export const getMediaStats = query({
  args: { userId: v.id("users") },
  returns: mediaStatsSchema,
  handler: async (ctx, args) => {
    const userMedia = await ctx.db
      .query("media")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const stats = {
      totalCount: userMedia.length,
      imageCount: 0,
      videoCount: 0,
      totalSize: 0,
    };

    for (const media of userMedia) {
      if (media.mediaType === "IMAGE") {
        stats.imageCount++;
      } else if (media.mediaType === "VIDEO") {
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
    let mediaItems: Doc<"media">[];

    const authCtx = await getAuthContext(ctx);

    if (!authCtx) {
      throw new Error("User not found");
    }

    if (authCtx.organizationId) {
      mediaItems = await ctx.db
        .query("media")
        .withIndex("by_organization_id", (q) =>
          q.eq("organizationId", authCtx.organizationId)
        )
        .collect();
    } else {
      mediaItems = await ctx.db
        .query("media")
        .withIndex("by_user_id", (q) => q.eq("userId", authCtx.userId))
        .collect();
    }

    // Filter by search term (search in filename, alt text, and extension)
    const searchTermLower = args.searchTerm.toLowerCase();
    let filteredMedia = mediaItems.filter((media) => {
      const filename = media.originalFilename?.toLowerCase() || "";
      const altText = media.altText?.toLowerCase() || "";
      const extension = media.extension?.toLowerCase() || "";

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

export const bulkDeleteMedia = mutation({
  args: { ids: v.array(v.id("media")) },
  returns: v.number(),
  handler: async (ctx, args) => {
    let deletedCount = 0;
    // Track total bytes per usage owner for batch decrement
    const bytesByOwner = new Map<string, number>();

    for (const id of args.ids) {
      const media = await ctx.db
        .query("media")
        .withIndex("by_id", (q) => q.eq("_id", id))
        .unique();

      if (media) {
        if (media.size) {
          const ownerId = await resolveUsageOwnerFromDoc(ctx, media);
          if (ownerId) {
            bytesByOwner.set(
              ownerId,
              (bytesByOwner.get(ownerId) ?? 0) + media.size
            );
          }
        }
        await ctx.db.delete(media._id);
        deletedCount++;
      }
    }

    // Batch decrement storage counters per owner
    for (const [ownerId, totalBytes] of bytesByOwner) {
      await adjustUsage(
        ctx,
        ownerId as Id<"users">,
        "mediaStorageBytes",
        -totalBytes
      );
    }

    return deletedCount;
  },
});

// API mutation — accepts explicit userId (no Clerk auth)
export const apiCreateMedia = mutation({
  args: {
    userId: v.id("users"),
    bucketKey: mediaCreateSchema.fields.bucketKey,
    url: mediaCreateSchema.fields.url,
    mediaType: mediaCreateSchema.fields.mediaType,
    originalFilename: mediaCreateSchema.fields.originalFilename,
    size: mediaCreateSchema.fields.size,
    extension: mediaCreateSchema.fields.extension,
    altText: mediaCreateSchema.fields.altText,
    bucketUrl: mediaCreateSchema.fields.bucketUrl,
    thumbnailBucketUrl: mediaCreateSchema.fields.thumbnailBucketUrl,
    thumbnailBucketKey: mediaCreateSchema.fields.thumbnailBucketKey,
  },
  returns: v.id("media"),
  handler: async (ctx, args) => {
    if (!isValidUrl(args.url)) {
      throw new Error("Invalid media URL");
    }
    if (args.bucketUrl && !isValidUrl(args.bucketUrl)) {
      throw new Error("Invalid bucket URL");
    }
    if (args.thumbnailBucketUrl && !isValidUrl(args.thumbnailBucketUrl)) {
      throw new Error("Invalid thumbnail bucket URL");
    }

    const now = getCurrentTimestamp();
    const { userId, ...mediaFields } = args;

    const newMediaId = await ctx.db.insert("media", {
      userId,
      bucketKey: mediaFields.bucketKey,
      url: mediaFields.url,
      mediaType: mediaFields.mediaType,
      originalFilename: mediaFields.originalFilename,
      size: mediaFields.size,
      extension: mediaFields.extension,
      altText: mediaFields.altText,
      bucketUrl: mediaFields.bucketUrl,
      thumbnailBucketUrl: mediaFields.thumbnailBucketUrl,
      thumbnailBucketKey: mediaFields.thumbnailBucketKey,
      createdAt: now,
      updatedAt: now,
    });

    // Increment media storage counter
    if (mediaFields.size) {
      await adjustUsage(ctx, userId, "mediaStorageBytes", mediaFields.size);
    }

    return newMediaId;
  },
});

// Internal function to clean up media for deleted users
export const cleanupMediaForDeletedUser = internalMutation({
  args: { userId: v.id("users") },
  returns: v.number(),
  handler: async (ctx, args) => {
    const userMedia = await ctx.db
      .query("media")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    for (const media of userMedia) {
      await ctx.db.delete(media._id);
    }

    return userMedia.length;
  },
});
