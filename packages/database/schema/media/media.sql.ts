import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from '../user/user.sql';
import { createUniqueIds } from '../utilts';

// Media type enum
export const mediaTypeEnum = pgEnum('media_type', ['IMAGE', 'VIDEO']);

export type MediaType = (typeof mediaTypeEnum.enumValues)[number];

export const MediaType = Object.fromEntries(
  mediaTypeEnum.enumValues.map((value) => [value, value])
) as Record<MediaType, MediaType>;

// Media table
export const media = pgTable(
  'media',
  {
    id: varchar('id', { length: 191 })
      .primaryKey()
      .$defaultFn(() => createUniqueIds('media')),
    userId: varchar('user_id', { length: 256 }).notNull(),
    organizationId: varchar('organization_id', { length: 256 }),
    bucketKey: varchar('bucket_key', { length: 512 }).notNull(),
    url: text('url').notNull(),
    mediaType: mediaTypeEnum('media_type').notNull(),
    originalFilename: varchar('original_filename', { length: 255 }),
    size: integer('size'), // File size in bytes
    extension: varchar('extension', { length: 10 }),
    altText: text('alt_text'),
    bucketUrl: text('bucket_url'), // For backward compatibility
    thumbnailBucketUrl: text('thumbnail_bucket_url'),
    thumbnailBucketKey: varchar('thumbnail_bucket_key', { length: 512 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('media_user_id_idx').on(table.userId),
    index('media_organization_id_idx').on(table.organizationId),
    index('media_bucket_key_idx').on(table.bucketKey),
    index('media_media_type_idx').on(table.mediaType),
    index('media_created_at_idx').on(table.createdAt),
  ]
);

export const MediaSelectSchema = createSelectSchema(media, {
  mediaType: z.enum(mediaTypeEnum.enumValues),
});

export const MediaInsertSchema = createInsertSchema(media, {
  mediaType: z.enum(mediaTypeEnum.enumValues),
});

export type Media = z.infer<typeof MediaSelectSchema>;
export type MediaInsert = z.infer<typeof MediaInsertSchema>;

// Relations
export const mediaRelations = relations(media, ({ one }) => ({
  user: one(users, {
    fields: [media.userId],
    references: [users.id],
  }),
}));
