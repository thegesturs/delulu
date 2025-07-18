import { v } from 'convex/values';
import type { Doc } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import { userCreateSchema, userSchema, userUpdateSchema } from './schemas';
import { getCurrentTimestamp, isValidEmail } from './utils';

// User queries
export const getUserById = query({
  args: { id: v.id('users') },
  returns: v.union(userSchema, v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_id', (q) => q.eq('_id', args.id))
      .unique();

    return user;
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  returns: v.union(userSchema, v.null()),
  handler: async (ctx, args) => {
    if (!isValidEmail(args.email)) {
      return null;
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .unique();

    return user;
  },
});

export const createUser = mutation({
  args: userCreateSchema.fields,
  returns: v.id('users'),
  handler: async (ctx, args) => {
    if (!isValidEmail(args.email)) {
      throw new Error('Invalid email format');
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .unique();

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const now = getCurrentTimestamp();

    const newUserId = await ctx.db.insert('users', {
      name: args.name,
      email: args.email,
      emailVerified: args.emailVerified ?? false,
      image: args.image,
      usage: {
        socialAccounts: 4,
        generatedPosts: 50,
        drafts: 15,
        organization: 0,
      },
      createdAt: now,
      updatedAt: now,
    });

    return newUserId;
  },
});

export const updateUser = mutation({
  args: {
    id: v.id('users'),
    ...userUpdateSchema.fields,
  },
  returns: v.id('users'),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_id', (q) => q.eq('_id', args.id))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    // If email is being updated, check for duplicates
    if (args.email && args.email !== user.email) {
      if (!isValidEmail(args.email) || !args.email) {
        throw new Error('Invalid email format');
      }

      const existingUser = await ctx.db
        .query('users')
        .withIndex('by_email', (q) => q.eq('email', args.email!))
        .unique();

      if (existingUser) {
        throw new Error('User with this email already exists');
      }
    }

    const updateData: Partial<Doc<'users'>> = {
      updatedAt: getCurrentTimestamp(),
    };

    if (args.name !== undefined) {
      updateData.name = args.name;
    }
    if (args.email !== undefined) updateData.email = args.email;
    if (args.emailVerified !== undefined)
      updateData.emailVerified = args.emailVerified;
    if (args.image !== undefined) updateData.image = args.image;

    await ctx.db.patch(user._id, updateData);

    return user._id;
  },
});

export const deleteUser = mutation({
  args: { id: v.id('users') },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_id', (q) => q.eq('_id', args.id))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    // Delete user's posts
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_user_id', (q) => q.eq('userId', args.id))
      .collect();

    for (const post of posts) {
      await ctx.db.delete(post._id);
    }

    // Delete user's social providers
    const socialProviders = await ctx.db
      .query('socialProviders')
      .withIndex('by_user_id', (q) => q.eq('userId', args.id))
      .collect();

    for (const provider of socialProviders) {
      await ctx.db.delete(provider._id);
    }

    // Delete user's media
    const media = await ctx.db
      .query('media')
      .withIndex('by_user_id', (q) => q.eq('userId', args.id))
      .collect();

    for (const mediaItem of media) {
      await ctx.db.delete(mediaItem._id);
    }

    // Finally, delete the user
    await ctx.db.delete(user._id);

    return true;
  },
});

// User usage queries and mutations
export const getUserUsage = query({
  args: { id: v.id('users') },
  returns: v.union(
    v.object({
      socialAccounts: v.number(),
      generatedPosts: v.number(),
      drafts: v.number(),
      organization: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_id', (q) => q.eq('_id', args.id))
      .unique();

    return user?.usage || null;
  },
});

export const updateUserUsage = mutation({
  args: {
    id: v.id('users'),
    socialAccounts: v.optional(v.number()),
    generatedPosts: v.optional(v.number()),
    drafts: v.optional(v.number()),
    organization: v.optional(v.number()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_id', (q) => q.eq('_id', args.id))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUsage = { ...user.usage };

    if (args.socialAccounts !== undefined) {
      updatedUsage.socialAccounts = args.socialAccounts;
    }
    if (args.generatedPosts !== undefined) {
      updatedUsage.generatedPosts = args.generatedPosts;
    }
    if (args.drafts !== undefined) {
      updatedUsage.drafts = args.drafts;
    }
    if (args.organization !== undefined) {
      updatedUsage.organization = args.organization;
    }

    await ctx.db.patch(user._id, {
      usage: updatedUsage,
      updatedAt: getCurrentTimestamp(),
    });

    return true;
  },
});
