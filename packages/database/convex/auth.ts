import { mutation, query } from './_generated/server';

// Example function for getting the current user with Clerk
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // Get user identity from Clerk JWT
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Not authenticated');
    }

    const email = identity.email;

    if (!email) {
      throw new Error('Email is required');
    }

    // Find user in our database
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first();

    return user;
  },
});

// Function to ensure user exists in Convex database (called from client)
export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Not authenticated');
    }

    const email = identity.email;

    if (!email) {
      throw new Error('Email is required');
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert('users', {
      email: email,
      name: identity.name || '',
      emailVerified: identity.emailVerified || false,
      externalId: identity.subject, // Clerk user ID
      image: identity.pictureUrl || undefined,
      usage: {
        socialAccounts: 0,
        generatedPosts: 0,
        drafts: 0,
        organization: 0,
      },
      updatedAt: Date.now(),
    });

    return userId;
  },
});
