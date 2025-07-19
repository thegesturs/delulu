import type { Doc, Id } from '@delulu/database/convex/_generated/dataModel';
// Type definitions for Convex entities used in components
import type { PostStatus, SocialType } from '@delulu/database/convex/utils';

// Re-export imported types for convenience
export type { SocialType, PostStatus };

// Basic Convex entity types
export type SocialProvider = Doc<'socialProviders'>;
export type SocialProviderId = Id<'socialProviders'>;

// Raw post type from Convex
export type PostDoc = Doc<'posts'>;
export type PostId = Id<'posts'>;

// Post type as returned by getPosts function (now returns raw postSchema documents)
export type Post = PostDoc;

// User types
export type User = Doc<'users'>;
export type UserId = Id<'users'>;

// Media types
export type Media = Doc<'media'>;
export type MediaId = Id<'media'>;

// Layout types for components
export type PostLayout = 'grid' | 'list';
