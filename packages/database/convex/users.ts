import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import {
  type QueryCtx,
  type MutationCtx,
  internalMutation,
  mutation,
  query,
} from './_generated/server';
import { userCreateSchema, userSchema, userUpdateSchema } from './schemas';
import { getCurrentTimestamp, isValidEmail } from './utils';

// Clerk UserJSON structure (minimal needed fields)
const clerkUserDataValidator = v.object({
  id: v.string(),
  first_name: v.union(v.string(), v.null()),
  last_name: v.union(v.string(), v.null()),
  image_url: v.union(v.string(), v.null()),
  email_addresses: v.array(v.object({
    email_address: v.string(),
    verification: v.union(
      v.object({
        status: v.string(),
      }),
      v.null()
    ),
  })),
});

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
      externalId: args.externalId,
      usage: {
        socialAccounts: 4,
        generatedPosts: 50,
        drafts: 15,
        organization: 0,
      },
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

// ============================================================================
// CLERK INTEGRATION FUNCTIONS
// ============================================================================

// Get current user from Clerk identity
export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

// Internal mutation to upsert user from Clerk webhook
export const upsertFromClerk = internalMutation({
  args: { data: clerkUserDataValidator },
  async handler(ctx, { data }) {
    const userAttributes = {
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'User',
      email: data.email_addresses?.[0]?.email_address || '',
      externalId: data.id,
      emailVerified:
        data.email_addresses?.[0]?.verification?.status === 'verified' || false,
      image: data.image_url || undefined,
      usage: {
        socialAccounts: 0,
        generatedPosts: 0,
        drafts: 0,
        organization: 0,
      },
      updatedAt: getCurrentTimestamp(),
    };

    const user = await userByExternalId(ctx, data.id);
    if (user === null) {
      // Create new user
      await ctx.db.insert('users', userAttributes);
    } else {
      // Update existing user
      await ctx.db.patch(user._id, userAttributes);
    }
  },
});

// Internal mutation to delete user from Clerk webhook
export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await userByExternalId(ctx, clerkUserId);

    if (user !== null) {
      // Use existing deleteUser logic for cascade delete
      await deleteUserInternal(ctx, user._id);
    } else {
      // Log warning - user not found for deletion
      throw new Error(`User not found for Clerk user ID: ${clerkUserId}`);
    }
  },
});

// Helper to get current user or throw
export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const userRecord = await getCurrentUser(ctx);
  if (!userRecord) throw new Error("Can't get current user");
  return userRecord;
}

// Helper to get current user from Clerk identity
export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return null;
  }
  return await userByExternalId(ctx, identity.subject);
}

// Helper to find user by Clerk external ID
async function userByExternalId(ctx: QueryCtx, externalId: string) {
  return await ctx.db
    .query('users')
    .withIndex('by_external_id', (q) => q.eq('externalId', externalId))
    .unique();
}

// Internal helper for cascading user deletion
async function deleteUserInternal(ctx: MutationCtx, userId: Id<'users'>) {
  // Delete user's posts
  const posts = await ctx.db
    .query('posts')
    .withIndex('by_user_id', (q) => q.eq('userId', userId))
    .collect();

  for (const post of posts) {
    await ctx.db.delete(post._id);
  }

  // Delete user's social providers
  const socialProviders = await ctx.db
    .query('socialProviders')
    .withIndex('by_user_id', (q) => q.eq('userId', userId))
    .collect();

  for (const provider of socialProviders) {
    await ctx.db.delete(provider._id);
  }

  // Delete user's media
  const media = await ctx.db
    .query('media')
    .withIndex('by_user_id', (q) => q.eq('userId', userId))
    .collect();

  for (const mediaItem of media) {
    await ctx.db.delete(mediaItem._id);
  }

  // Finally, delete the user
  await ctx.db.delete(userId);
}
