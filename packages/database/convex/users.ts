import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { userCreateSchema, userSchema, userUpdateSchema } from './schemas';
import { createUniqueIds, getCurrentTimestamp, isValidEmail } from './utils';

// User queries
export const getUserById = query({
  args: { id: v.string() },
  returns: v.union(userSchema, v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_id', (q) => q.eq('id', args.id))
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
    const userId = createUniqueIds('user');

    const newUserId = await ctx.db.insert('users', {
      id: userId,
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
    id: v.string(),
    ...userUpdateSchema.fields,
  },
  returns: v.id('users'),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_id', (q) => q.eq('id', args.id))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    // If email is being updated, check for duplicates
    if (args.email && args.email !== user.email) {
      if (!isValidEmail(args.email)) {
        throw new Error('Invalid email format');
      }

      const existingUser = await ctx.db
        .query('users')
        .withIndex('by_email', (q) => q.eq('email', args.email))
        .unique();

      if (existingUser) {
        throw new Error('User with this email already exists');
      }
    }

    const updateData: any = {
      updatedAt: getCurrentTimestamp(),
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.email !== undefined) updateData.email = args.email;
    if (args.emailVerified !== undefined)
      updateData.emailVerified = args.emailVerified;
    if (args.image !== undefined) updateData.image = args.image;

    await ctx.db.patch(user._id, updateData);

    return user._id;
  },
});

export const deleteUser = mutation({
  args: { id: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_id', (q) => q.eq('id', args.id))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    // Delete user's sessions
    const sessions = await ctx.db
      .query('sessions')
      .withIndex('by_user_id', (q) => q.eq('userId', args.id))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    // Delete user's accounts
    const accounts = await ctx.db
      .query('accounts')
      .withIndex('by_user_id', (q) => q.eq('userId', args.id))
      .collect();

    for (const account of accounts) {
      await ctx.db.delete(account._id);
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
  args: { userId: v.string() },
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
      .withIndex('by_id', (q) => q.eq('id', args.userId))
      .unique();

    return user?.usage || null;
  },
});

export const updateUserUsage = mutation({
  args: {
    userId: v.string(),
    socialAccounts: v.optional(v.number()),
    generatedPosts: v.optional(v.number()),
    drafts: v.optional(v.number()),
    organization: v.optional(v.number()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_id', (q) => q.eq('id', args.userId))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUsage = { ...user.usage };

    if (args.socialAccounts !== undefined)
      updatedUsage.socialAccounts = args.socialAccounts;
    if (args.generatedPosts !== undefined)
      updatedUsage.generatedPosts = args.generatedPosts;
    if (args.drafts !== undefined) updatedUsage.drafts = args.drafts;
    if (args.organization !== undefined)
      updatedUsage.organization = args.organization;

    await ctx.db.patch(user._id, {
      usage: updatedUsage,
      updatedAt: getCurrentTimestamp(),
    });

    return true;
  },
});

// Session queries and mutations
export const getSessionByToken = query({
  args: { token: v.string() },
  returns: v.union(
    v.object({
      _id: v.id('sessions'),
      id: v.string(),
      token: v.string(),
      userId: v.string(),
      expiresAt: v.number(),
      ipAddress: v.optional(v.string()),
      userAgent: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .unique();

    // Check if session is expired
    if (session && session.expiresAt < getCurrentTimestamp()) {
      // Delete expired session
      await ctx.db.delete(session._id);
      return null;
    }

    return session;
  },
});

export const createSession = mutation({
  args: {
    token: v.string(),
    userId: v.string(),
    expiresAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  returns: v.id('sessions'),
  handler: async (ctx, args) => {
    const now = getCurrentTimestamp();
    const sessionId = createUniqueIds('session');

    const newSessionId = await ctx.db.insert('sessions', {
      id: sessionId,
      token: args.token,
      userId: args.userId,
      expiresAt: args.expiresAt,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      createdAt: now,
      updatedAt: now,
    });

    return newSessionId;
  },
});

export const deleteSession = mutation({
  args: { token: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .unique();

    if (!session) {
      return false;
    }

    await ctx.db.delete(session._id);
    return true;
  },
});

export const deleteUserSessions = mutation({
  args: { userId: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query('sessions')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    return sessions.length;
  },
});

// Account queries and mutations
export const getAccountByProvider = query({
  args: { providerId: v.string(), accountId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id('accounts'),
      id: v.string(),
      userId: v.string(),
      accountId: v.string(),
      providerId: v.string(),
      accessToken: v.optional(v.string()),
      refreshToken: v.optional(v.string()),
      idToken: v.optional(v.string()),
      accessTokenExpiresAt: v.optional(v.number()),
      refreshTokenExpiresAt: v.optional(v.number()),
      scope: v.optional(v.string()),
      password: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query('accounts')
      .withIndex('by_provider_and_account', (q) =>
        q.eq('providerId', args.providerId).eq('accountId', args.accountId)
      )
      .unique();

    return account;
  },
});

export const getUserAccounts = query({
  args: { userId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id('accounts'),
      id: v.string(),
      userId: v.string(),
      accountId: v.string(),
      providerId: v.string(),
      accessToken: v.optional(v.string()),
      refreshToken: v.optional(v.string()),
      idToken: v.optional(v.string()),
      accessTokenExpiresAt: v.optional(v.number()),
      refreshTokenExpiresAt: v.optional(v.number()),
      scope: v.optional(v.string()),
      password: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query('accounts')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .collect();

    return accounts;
  },
});

export const createAccount = mutation({
  args: {
    userId: v.string(),
    accountId: v.string(),
    providerId: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    idToken: v.optional(v.string()),
    accessTokenExpiresAt: v.optional(v.number()),
    refreshTokenExpiresAt: v.optional(v.number()),
    scope: v.optional(v.string()),
    password: v.optional(v.string()),
  },
  returns: v.id('accounts'),
  handler: async (ctx, args) => {
    const now = getCurrentTimestamp();
    const accountIdString = createUniqueIds('account');

    const newAccountId = await ctx.db.insert('accounts', {
      id: accountIdString,
      userId: args.userId,
      accountId: args.accountId,
      providerId: args.providerId,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      idToken: args.idToken,
      accessTokenExpiresAt: args.accessTokenExpiresAt,
      refreshTokenExpiresAt: args.refreshTokenExpiresAt,
      scope: args.scope,
      password: args.password,
      createdAt: now,
      updatedAt: now,
    });

    return newAccountId;
  },
});

export const updateAccount = mutation({
  args: {
    id: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    idToken: v.optional(v.string()),
    accessTokenExpiresAt: v.optional(v.number()),
    refreshTokenExpiresAt: v.optional(v.number()),
    scope: v.optional(v.string()),
    password: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query('accounts')
      .withIndex('by_id', (q) => q.eq('id', args.id))
      .unique();

    if (!account) {
      throw new Error('Account not found');
    }

    const updateData: any = {
      updatedAt: getCurrentTimestamp(),
    };

    if (args.accessToken !== undefined)
      updateData.accessToken = args.accessToken;
    if (args.refreshToken !== undefined)
      updateData.refreshToken = args.refreshToken;
    if (args.idToken !== undefined) updateData.idToken = args.idToken;
    if (args.accessTokenExpiresAt !== undefined)
      updateData.accessTokenExpiresAt = args.accessTokenExpiresAt;
    if (args.refreshTokenExpiresAt !== undefined)
      updateData.refreshTokenExpiresAt = args.refreshTokenExpiresAt;
    if (args.scope !== undefined) updateData.scope = args.scope;
    if (args.password !== undefined) updateData.password = args.password;

    await ctx.db.patch(account._id, updateData);

    return true;
  },
});

export const deleteAccount = mutation({
  args: { id: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query('accounts')
      .withIndex('by_id', (q) => q.eq('id', args.id))
      .unique();

    if (!account) {
      return false;
    }

    await ctx.db.delete(account._id);
    return true;
  },
});

// Verification queries and mutations
export const getVerification = query({
  args: { identifier: v.string(), value: v.string() },
  returns: v.union(
    v.object({
      _id: v.id('verifications'),
      id: v.string(),
      identifier: v.string(),
      value: v.string(),
      expiresAt: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const verification = await ctx.db
      .query('verifications')
      .withIndex('by_identifier_and_value', (q) =>
        q.eq('identifier', args.identifier).eq('value', args.value)
      )
      .unique();

    // Check if verification is expired
    if (verification && verification.expiresAt < getCurrentTimestamp()) {
      // Delete expired verification
      await ctx.db.delete(verification._id);
      return null;
    }

    return verification;
  },
});

export const createVerification = mutation({
  args: {
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.number(),
  },
  returns: v.id('verifications'),
  handler: async (ctx, args) => {
    const now = getCurrentTimestamp();
    const verificationId = createUniqueIds('verification');

    const newVerificationId = await ctx.db.insert('verifications', {
      id: verificationId,
      identifier: args.identifier,
      value: args.value,
      expiresAt: args.expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    return newVerificationId;
  },
});

export const deleteVerification = mutation({
  args: { identifier: v.string(), value: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const verification = await ctx.db
      .query('verifications')
      .withIndex('by_identifier_and_value', (q) =>
        q.eq('identifier', args.identifier).eq('value', args.value)
      )
      .unique();

    if (!verification) {
      return false;
    }

    await ctx.db.delete(verification._id);
    return true;
  },
});
