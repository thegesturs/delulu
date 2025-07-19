import {
  type AuthFunctions,
  BetterAuth,
  type PublicAuthFunctions,
} from '@convex-dev/better-auth';
import { api, components, internal } from './_generated/api';
import type { DataModel, Id } from './_generated/dataModel';
import { query } from './_generated/server';

// Typesafe way to pass Convex functions defined in this file
const authFunctions: AuthFunctions = internal.auth;
const publicAuthFunctions: PublicAuthFunctions = api.auth;

// Initialize the component
export const betterAuthComponent = new BetterAuth(components.betterAuth, {
  authFunctions,
  publicAuthFunctions,
});

// These are required named exports
export const {
  createUser,
  updateUser,
  deleteUser,
  createSession,
  isAuthenticated,
} = betterAuthComponent.createAuthFunctions<DataModel>({
  // Must create a user and return the user id
  onCreateUser: async (ctx, user) => {
    // Example: copy the user's email to the application users table.
    // We'll use onUpdateUser to keep it synced.
    const userId = await ctx.db.insert('users', {
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      usage: {
        socialAccounts: 0,
        generatedPosts: 0,
        drafts: 0,
        organization: 0,
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

    // This function must return the user id.
    return userId;
  },

  // Delete the user when they are deleted from Better Auth
  onDeleteUser: async (ctx, userId) => {
    // Use cascade delete to clean up all related data
    await ctx.runMutation(api.cascade_deletes.deleteUserWithCascade, {
      userId: userId as Id<'users'>,
    });
  },
});

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // Get user data from Better Auth - email, name, image, etc.
    const userMetadata = await betterAuthComponent.getAuthUser(ctx);
    console.log('userMetadata', userMetadata);

    // Get user data from your application's database
    // (skip this if you have no fields in your users table schema)
    const user = await ctx.db.get(userMetadata.userId as Id<'users'>);
    return {
      ...user,
    };
  },
});
