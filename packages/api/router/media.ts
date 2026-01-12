import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { fetchMutation, fetchQuery } from '@delulu/database/server';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const mediaRouter = createTRPCRouter({
  // Get media by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const media = await fetchQuery(
        api.media.getMediaById,
        {
          id: input.id as Id<'media'>,
        },
        {
          token: ctx.token,
        }
      );

      if (!media || media.userId !== ctx.userId) {
        throw new Error('Media not found');
      }

      return media;
    }),

  // Get media by bucket key
  getByBucketKey: protectedProcedure
    .input(z.object({ bucketKey: z.string() }))
    .query(async ({ ctx, input }) => {
      const media = await fetchQuery(
        api.media.getMediaByBucketKey,
        {
          bucketKey: input.bucketKey,
        },
        {
          token: ctx.token,
        }
      );

      if (!media || media.userId !== ctx.userId) {
        throw new Error('Media not found');
      }

      return media;
    }),

  // Create media record
  create: protectedProcedure
    .input(
      z.object({
        bucketKey: z.string(),
        url: z.string(),
        mediaType: z.enum(['IMAGE', 'VIDEO']),
        originalFilename: z.string().optional(),
        size: z.number().optional(),
        extension: z.string().optional(),
        altText: z.string().optional(),
        bucketUrl: z.string().optional(),
        thumbnailBucketUrl: z.string().optional(),
        thumbnailBucketKey: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await fetchMutation(api.media.createMedia, {
        ...input,
      });
    }),

  // Update media
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        altText: z.string().optional(),
        originalFilename: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      // Verify ownership
      const existingMedia = await fetchQuery(
        api.media.getMediaById,
        {
          id: id as Id<'media'>,
        },
        {
          token: ctx.token,
        }
      );

      if (!existingMedia || existingMedia.userId !== ctx.userId) {
        throw new Error('Media not found');
      }

      return await fetchMutation(
        api.media.updateMedia,
        {
          id: id as Id<'media'>,
          ...updates,
        },
        {
          token: ctx.token,
        }
      );
    }),

  // Delete media
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existingMedia = await fetchQuery(
        api.media.getMediaById,
        {
          id: input.id as Id<'media'>,
        },
        {
          token: ctx.token,
        }
      );

      if (!existingMedia || existingMedia.userId !== ctx.userId) {
        throw new Error('Media not found');
      }

      return await fetchMutation(
        api.media.deleteMedia,
        {
          id: input.id as Id<'media'>,
        },
        {
          token: ctx.token,
        }
      );
    }),

  // Get media stats
  getStats: protectedProcedure.query(async ({ ctx }) => {
    return await fetchQuery(
      api.media.getMediaStats,
      {
        userId: ctx.userId,
      },
      {
        token: ctx.token,
      }
    );
  }),
});
