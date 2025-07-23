import type { api } from '@delulu/database/convex/_generated/api';
import type { Doc, Id } from '@delulu/database/convex/_generated/dataModel';
import type { FunctionReturnType } from 'convex/server';

// Re-export imported types for convenience
export type { SocialType, PostStatus } from '@delulu/database/convex/utils';

// Raw post type from Convex
export type PostDoc = NonNullable<
  FunctionReturnType<typeof api.posts.getPostById>
>;
export type PostId = Id<'posts'>;

// Post type as returned by getPosts function (now returns raw postSchema documents)
export type Post = PostDoc;
export type SocialProvider = Doc<'socialProviders'>;

// User types
export type User = Doc<'users'>;
export type UserId = Id<'users'>;

// Media types
export type Media = Doc<'media'>;
export type MediaId = Id<'media'>;

// Layout types for components
export type PostLayout = 'grid' | 'list';
