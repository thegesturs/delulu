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

// Automation types
export type Automation = Doc<'automations'>;
export type AutomationId = Id<'automations'>;
export type AutomationLog = Doc<'automationLogs'>;

// Layout types for components
export type PostLayout = 'grid' | 'list';

// Stats types
export type DashboardStats = NonNullable<
  FunctionReturnType<typeof api.stats.getDashboardStats>
>;

// Enriched post types for stats queries that include populated socialProviders
export type FailedPost = NonNullable<
  FunctionReturnType<typeof api.stats.getFailedPosts>
>[0];

export type UpcomingPost = NonNullable<
  FunctionReturnType<typeof api.stats.getUpcomingPosts>
>[0];
