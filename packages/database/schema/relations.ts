import { relations } from 'drizzle-orm';
import { users } from './user/user.sql';
import { posts, alternatePostContent, platformPosts } from './post/post.sql';
import { socialProviders } from './social/social.sql';

// Complete relations including cross-schema relationships
export const usersCompleteRelations = relations(users, ({ many, one }) => ({
  posts: many(posts),
  socialProviders: many(socialProviders),
}));

export const postsCompleteRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  alternateContents: many(alternatePostContent),
  platformPosts: many(platformPosts),
  socialProviders: many(socialProviders),
}));

export const socialProvidersCompleteRelations = relations(socialProviders, ({ one, many }) => ({
  user: one(users, {
    fields: [socialProviders.userId],
    references: [users.id],
  }),
  posts: many(posts),
  alternateContents: many(alternatePostContent),
  platformPosts: many(platformPosts),
}));

export const alternatePostContentCompleteRelations = relations(alternatePostContent, ({ one }) => ({
  post: one(posts, {
    fields: [alternatePostContent.postId],
    references: [posts.id],
  }),
  socialProvider: one(socialProviders, {
    fields: [alternatePostContent.socialProviderId],
    references: [socialProviders.id],
  }),
}));

export const platformPostsCompleteRelations = relations(platformPosts, ({ one }) => ({
  post: one(posts, {
    fields: [platformPosts.postId],
    references: [posts.id],
  }),
  socialProvider: one(socialProviders, {
    fields: [platformPosts.platformId],
    references: [socialProviders.id],
  }),
}));