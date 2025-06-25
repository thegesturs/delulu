import { and, desc, eq, inArray } from 'drizzle-orm';
import { database } from '../../index';
import { type MediaInsert, MediaSelectSchema, media } from './media.sql';

// Create media record
export const createMedia = async (mediaData: MediaInsert) => {
  const [newMedia] = await database.insert(media).values(mediaData).returning();
  return MediaSelectSchema.parse(newMedia);
};

// Get media by ID
export const getMediaById = async (id: string) => {
  const result = await database
    .select()
    .from(media)
    .where(eq(media.id, id))
    .limit(1);
  return result.length > 0 ? MediaSelectSchema.parse(result[0]) : null;
};

// Get media by bucket key
export const getMediaByBucketKey = async (bucketKey: string) => {
  const result = await database
    .select()
    .from(media)
    .where(eq(media.bucketKey, bucketKey))
    .limit(1);
  return result.length > 0 ? MediaSelectSchema.parse(result[0]) : null;
};

// Get media by user ID
export const getMediaByUserId = async (
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    mediaType?: 'IMAGE' | 'VIDEO';
  }
) => {
  const { limit = 50, offset = 0, mediaType } = options || {};

  let query = database
    .select()
    .from(media)
    .where(eq(media.userId, userId))
    .orderBy(desc(media.createdAt))
    .limit(limit)
    .offset(offset);

  if (mediaType) {
    query = database
      .select()
      .from(media)
      .where(and(eq(media.userId, userId), eq(media.mediaType, mediaType)))
      .orderBy(desc(media.createdAt))
      .limit(limit)
      .offset(offset);
  }

  const result = await query;
  return result.map((item) => MediaSelectSchema.parse(item));
};

// Get multiple media by IDs
export const getMediaByIds = async (ids: string[]) => {
  if (ids.length === 0) return [];

  const result = await database
    .select()
    .from(media)
    .where(inArray(media.id, ids));

  return result.map((item) => MediaSelectSchema.parse(item));
};

// Update media
export const updateMedia = async (
  id: string,
  updates: Partial<Omit<MediaInsert, 'id' | 'createdAt'>>
) => {
  const [updatedMedia] = await database
    .update(media)
    .set({ ...updates })
    .where(eq(media.id, id))
    .returning();

  return updatedMedia ? MediaSelectSchema.parse(updatedMedia) : null;
};

// Delete media
export const deleteMedia = async (id: string) => {
  const [deletedMedia] = await database
    .delete(media)
    .where(eq(media.id, id))
    .returning();

  return deletedMedia ? MediaSelectSchema.parse(deletedMedia) : null;
};

// Get media stats for user
export const getMediaStats = async (userId: string) => {
  const result = await database
    .select({
      mediaType: media.mediaType,
    })
    .from(media)
    .where(eq(media.userId, userId))
    .groupBy(media.mediaType);

  return result;
};

export const mediaQueries = {
  createMedia,
  getMediaById,
  getMediaByBucketKey,
  getMediaByUserId,
  getMediaByIds,
  updateMedia,
  deleteMedia,
  getMediaStats,
};
