# API Functions Reference

## Overview

This document provides a comprehensive reference for all Convex functions including queries, mutations, and actions across the entire system.

## Function Categories

- **Queries** - Read-only operations that can be subscribed to
- **Mutations** - Write operations that modify database state
- **Actions** - Server-side functions that can call external APIs
- **Internal Functions** - Functions only callable from other Convex functions

## Authentication Functions (`auth.ts`)

### Better Auth Integration

```typescript
// Better Auth component functions
export const {
  createUser,
  updateUser,
  deleteUser,
  createSession,
  isAuthenticated,
} = betterAuthComponent.createAuthFunctions<DataModel>();
```

### User Queries

#### Get Current User

```typescript
export const getCurrentUser = query({
  args: {},
  returns: v.union(userSchema, v.null()),
  handler: async (ctx) => {
    const userMetadata = await betterAuthComponent.getAuthUser(ctx);
    if (!userMetadata) return null;
    
    const user = await ctx.db.get(userMetadata.userId as Id<'users'>);
    return { ...user, ...userMetadata };
  },
});
```

## User Management Functions (`users.ts`)

### User Queries

#### Get User by ID

```typescript
export const getUserById = query({
  args: { id: v.id('users') },
  returns: v.union(userSchema, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

#### Get User by Email

```typescript
export const getUserByEmail = query({
  args: { email: v.string() },
  returns: v.union(userSchema, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .unique();
  },
});
```

### User Mutations

#### Create User

```typescript
export const createUser = mutation({
  args: userCreateSchema.fields,
  returns: v.id('users'),
  handler: async (ctx, args) => {
    const now = getCurrentTimestamp();
    
    return await ctx.db.insert('users', {
      ...args,
      emailVerified: args.emailVerified ?? false,
      usage: {
        socialAccounts: 0,
        generatedPosts: 0,
        drafts: 0,
        organization: 0,
      },
      createdAt: now,
      updatedAt: now,
    });
  },
});
```

#### Update User

```typescript
export const updateUser = mutation({
  args: {
    id: v.id('users'),
    ...userUpdateSchema.fields,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) {
      throw new Error('User not found');
    }
    
    const updateData = {
      ...args,
      updatedAt: getCurrentTimestamp(),
    };
    
    await ctx.db.patch(user._id, updateData);
    return true;
  },
});
```

#### Update User Usage

```typescript
export const updateUserUsage = mutation({
  args: {
    id: v.id('users'),
    usage: v.object({
      socialAccounts: v.optional(v.number()),
      generatedPosts: v.optional(v.number()),
      drafts: v.optional(v.number()),
      organization: v.optional(v.number()),
    }),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) {
      throw new Error('User not found');
    }
    
    const updatedUsage = {
      ...user.usage,
      ...args.usage,
    };
    
    await ctx.db.patch(user._id, {
      usage: updatedUsage,
      updatedAt: getCurrentTimestamp(),
    });
    
    return true;
  },
});
```

## Post Management Functions (`posts.ts`)

### Post Queries

#### Get Post by ID

```typescript
export const getPostById = query({
  args: { id: v.id('posts') },
  returns: v.union(postSchema, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

#### Get User Posts

```typescript
export const getUserPosts = query({
  args: {
    userId: v.id('users'),
    ...postFiltersSchema.fields,
  },
  returns: v.array(postSchema),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query('posts')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId));
    
    // Apply filters
    if (args.status) {
      query = query.filter((q) => q.eq(q.field('status'), args.status));
    }
    if (args.isDeleted !== undefined) {
      query = query.filter((q) => q.eq(q.field('isDeleted'), args.isDeleted));
    }
    
    const posts = await query.collect();
    
    // Sort by creation date (newest first)
    posts.sort((a, b) => b.createdAt - a.createdAt);
    
    // Apply pagination
    const offset = args.offset ?? 0;
    const limit = args.limit ?? 50;
    
    return posts.slice(offset, offset + limit);
  },
});
```

#### Get Scheduled Posts

```typescript
export const getScheduledPosts = query({
  args: {
    beforeTimestamp: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.array(postSchema),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const beforeTimestamp = args.beforeTimestamp ?? getCurrentTimestamp();
    
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_scheduled_at', (q) => q.lt('scheduledAt', beforeTimestamp))
      .filter((q) => q.eq(q.field('status'), 'SCHEDULED'))
      .order('asc')
      .take(limit);
    
    return posts;
  },
});
```

### Post Mutations

#### Create Post

```typescript
export const createPost = mutation({
  args: postCreateSchema.fields,
  returns: v.id('posts'),
  handler: async (ctx, args) => {
    const now = getCurrentTimestamp();
    
    return await ctx.db.insert('posts', {
      ...args,
      reviewStatus: args.reviewStatus ?? 'PENDING',
      privacyStatus: args.privacyStatus ?? 'PUBLIC',
      isDeleted: false,
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});
```

#### Update Post

```typescript
export const updatePost = mutation({
  args: {
    id: v.id('posts'),
    ...postUpdateSchema.fields,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post) {
      throw new Error('Post not found');
    }
    
    const updateData = {
      ...args,
      updatedAt: getCurrentTimestamp(),
    };
    
    await ctx.db.patch(post._id, updateData);
    return true;
  },
});
```

#### Soft Delete Post

```typescript
export const softDeletePost = mutation({
  args: { id: v.id('posts') },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post) {
      throw new Error('Post not found');
    }
    
    await ctx.db.patch(post._id, {
      isDeleted: true,
      status: 'DELETED',
      updatedAt: getCurrentTimestamp(),
    });
    
    return true;
  },
});
```

#### Publish Post

```typescript
export const publishPost = mutation({
  args: { id: v.id('posts') },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post) {
      throw new Error('Post not found');
    }
    
    await ctx.db.patch(post._id, {
      status: 'PUBLISHED',
      publishedAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    });
    
    return true;
  },
});
```

## Social Provider Functions (`social_providers.ts`)

### Social Provider Queries

#### Get Social Provider by ID

```typescript
export const getSocialProviderById = query({
  args: { id: v.id('socialProviders') },
  returns: v.union(socialProviderSchema, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

#### Get User Social Providers

```typescript
export const getUserSocialProviders = query({
  args: { userId: v.id('users') },
  returns: v.array(socialProviderSchema),
  handler: async (ctx, args) => {
    const providers = await ctx.db
      .query('socialProviders')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();
    
    providers.sort((a, b) => b.createdAt - a.createdAt);
    return providers;
  },
});
```

#### Get Expired Tokens

```typescript
export const getExpiredTokens = query({
  args: {},
  returns: v.array(socialProviderSchema),
  handler: async (ctx) => {
    const now = getCurrentTimestamp();
    
    return await ctx.db
      .query('socialProviders')
      .withIndex('by_is_active', (q) => q.eq('isActive', true))
      .filter((q) => q.lt(q.field('expiresIn'), now))
      .collect();
  },
});
```

### Social Provider Mutations

#### Create Social Provider

```typescript
export const createSocialProvider = mutation({
  args: socialProviderCreateSchema.fields,
  returns: v.id('socialProviders'),
  handler: async (ctx, args) => {
    const encryptedAccessToken = await encryptData(args.accessToken);
    const encryptedRefreshToken = args.refreshToken
      ? await encryptData(args.refreshToken)
      : undefined;
    
    const now = getCurrentTimestamp();
    
    return await ctx.db.insert('socialProviders', {
      ...args,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      createdAt: now,
      updatedAt: now,
      isActive: args.isActive ?? true,
    });
  },
});
```

#### Update Social Provider

```typescript
export const updateSocialProvider = mutation({
  args: {
    id: v.id('socialProviders'),
    ...socialProviderUpdateSchema.fields,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.id);
    if (!provider) {
      throw new Error('Social provider not found');
    }
    
    const updateData = {
      updatedAt: getCurrentTimestamp(),
    };
    
    // Encrypt tokens if being updated
    if (args.accessToken !== undefined) {
      updateData.accessToken = await encryptData(args.accessToken);
    }
    if (args.refreshToken !== undefined) {
      updateData.refreshToken = args.refreshToken
        ? await encryptData(args.refreshToken)
        : undefined;
    }
    
    Object.assign(updateData, args);
    
    await ctx.db.patch(provider._id, updateData);
    return true;
  },
});
```

## Media Management Functions (`media.ts`)

### Media Queries

#### Get Media by ID

```typescript
export const getMediaById = query({
  args: { id: v.id('media') },
  returns: v.union(mediaTableSchema, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

#### Get User Media

```typescript
export const getUserMedia = query({
  args: {
    userId: v.id('users'),
    ...mediaFiltersSchema.fields,
  },
  returns: v.array(mediaTableSchema),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query('media')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId));
    
    if (args.mediaType) {
      query = query.filter((q) => q.eq(q.field('mediaType'), args.mediaType));
    }
    
    const media = await query.collect();
    
    // Sort by creation date (newest first)
    media.sort((a, b) => b.createdAt - a.createdAt);
    
    // Apply pagination
    const offset = args.offset ?? 0;
    const limit = args.limit ?? 50;
    
    return media.slice(offset, offset + limit);
  },
});
```

#### Get Media Stats

```typescript
export const getMediaStats = query({
  args: { userId: v.id('users') },
  returns: mediaStatsSchema,
  handler: async (ctx, args) => {
    const media = await ctx.db
      .query('media')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .collect();
    
    const stats = {
      totalCount: media.length,
      imageCount: media.filter(m => m.mediaType === 'IMAGE').length,
      videoCount: media.filter(m => m.mediaType === 'VIDEO').length,
      totalSize: media.reduce((sum, m) => sum + (m.size || 0), 0),
    };
    
    return stats;
  },
});
```

### Media Mutations

#### Create Media

```typescript
export const createMedia = mutation({
  args: mediaCreateSchema.fields,
  returns: v.id('media'),
  handler: async (ctx, args) => {
    const now = getCurrentTimestamp();
    
    return await ctx.db.insert('media', {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});
```

#### Update Media

```typescript
export const updateMedia = mutation({
  args: {
    id: v.id('media'),
    ...mediaUpdateSchema.fields,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const media = await ctx.db.get(args.id);
    if (!media) {
      throw new Error('Media not found');
    }
    
    const updateData = {
      ...args,
      updatedAt: getCurrentTimestamp(),
    };
    
    await ctx.db.patch(media._id, updateData);
    return true;
  },
});
```

#### Delete Media

```typescript
export const deleteMedia = mutation({
  args: { id: v.id('media') },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const media = await ctx.db.get(args.id);
    if (!media) {
      throw new Error('Media not found');
    }
    
    await ctx.db.delete(media._id);
    return true;
  },
});
```

## Cascade Delete Functions (`cascade_deletes.ts`)

### User Cascade Delete

```typescript
export const deleteUserWithCascade = mutation({
  args: { userId: v.id('users') },
  returns: userDeleteResultSchema,
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    let deletedSessionsCount = 0;
    let deletedAccountsCount = 0;
    let deletedPostsCount = 0;
    let deletedSocialProvidersCount = 0;
    let deletedMediaCount = 0;
    
    // Delete user's sessions
    const sessions = await ctx.db
      .query('sessions')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .collect();
    
    for (const session of sessions) {
      await ctx.db.delete(session._id);
      deletedSessionsCount++;
    }
    
    // Delete user's accounts
    const accounts = await ctx.db
      .query('accounts')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .collect();
    
    for (const account of accounts) {
      await ctx.db.delete(account._id);
      deletedAccountsCount++;
    }
    
    // Delete user's posts
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .collect();
    
    for (const post of posts) {
      await ctx.db.delete(post._id);
      deletedPostsCount++;
    }
    
    // Delete user's social providers
    const socialProviders = await ctx.db
      .query('socialProviders')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .collect();
    
    for (const provider of socialProviders) {
      await ctx.runMutation(api.cascade_deletes.deleteSocialProviderWithCascade, {
        socialProviderId: provider._id,
      });
      deletedSocialProvidersCount++;
    }
    
    // Delete user's media
    const mediaItems = await ctx.db
      .query('media')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .collect();
    
    for (const media of mediaItems) {
      await ctx.db.delete(media._id);
      deletedMediaCount++;
    }
    
    // Delete the user
    await ctx.db.delete(user._id);
    
    return {
      success: true,
      deletedSessionsCount,
      deletedAccountsCount,
      deletedPostsCount,
      deletedSocialProvidersCount,
      deletedMediaCount,
      message: `Successfully deleted user and all related data`,
    };
  },
});
```

### Social Provider Cascade Delete

```typescript
export const deleteSocialProviderWithCascade = mutation({
  args: { socialProviderId: v.id('socialProviders') },
  returns: cascadeDeleteResultSchema,
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.socialProviderId);
    if (!provider) {
      throw new Error('Social provider not found');
    }
    
    let updatedPostsCount = 0;
    const deletedPlatformPostsCount = 0;
    
    // Clean up posts that reference this social provider
    const posts = await ctx.db.query('posts').collect();
    
    for (const post of posts) {
      let needsUpdate = false;
      const updateData = {};
      
      // Remove from socialProviderIds array
      if (post.socialProviderIds.includes(args.socialProviderId)) {
        updateData.socialProviderIds = post.socialProviderIds.filter(
          (id) => id !== args.socialProviderId
        );
        needsUpdate = true;
      }
      
      // Remove from alternativeContent array
      if (post.alternativeContent) {
        const filteredAlternativeContent = post.alternativeContent.filter(
          (alt) => alt.socialProviderId !== args.socialProviderId
        );
        
        if (filteredAlternativeContent.length !== post.alternativeContent.length) {
          updateData.alternativeContent = filteredAlternativeContent.length > 0
            ? filteredAlternativeContent
            : undefined;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        updateData.updatedAt = getCurrentTimestamp();
        await ctx.db.patch(post._id, updateData);
        updatedPostsCount++;
      }
    }
    
    // Delete the social provider
    await ctx.db.delete(provider._id);
    
    return {
      success: true,
      updatedPostsCount,
      deletedPlatformPostsCount,
      message: `Successfully deleted social provider and updated ${updatedPostsCount} posts`,
    };
  },
});
```

### Cleanup Functions

#### Cleanup Expired Sessions

```typescript
export const cleanupExpiredSessions = mutation({
  args: {},
  returns: cleanupResultSchema,
  handler: async (ctx) => {
    const now = getCurrentTimestamp();
    let deletedCount = 0;
    
    const sessions = await ctx.db.query('sessions').collect();
    
    for (const session of sessions) {
      if (session.expiresAt < now) {
        await ctx.db.delete(session._id);
        deletedCount++;
      }
    }
    
    return {
      success: true,
      deletedCount,
      message: `Cleaned up ${deletedCount} expired sessions`,
    };
  },
});
```

#### Cleanup Expired Verifications

```typescript
export const cleanupExpiredVerifications = mutation({
  args: {},
  returns: cleanupResultSchema,
  handler: async (ctx) => {
    const now = getCurrentTimestamp();
    let deletedCount = 0;
    
    const verifications = await ctx.db.query('verifications').collect();
    
    for (const verification of verifications) {
      if (verification.expiresAt < now) {
        await ctx.db.delete(verification._id);
        deletedCount++;
      }
    }
    
    return {
      success: true,
      deletedCount,
      message: `Cleaned up ${deletedCount} expired verifications`,
    };
  },
});
```

## Email Functions (`emails.tsx`)

### Email Actions

#### Send Email Verification

```typescript
export const sendEmailVerification = async (
  ctx: ActionCtx,
  { to, url }: { to: string; url: string }
) => {
  await resend.sendEmail(ctx, {
    from: 'Delulu Social <noreply@delulu.social>',
    to,
    subject: 'Verify your email address',
    html: await render(<VerifyEmail url={url} />),
  });
};
```

#### Send OTP Verification

```typescript
export const sendOTPVerification = async (
  ctx: ActionCtx,
  { to, code }: { to: string; code: string }
) => {
  await resend.sendEmail(ctx, {
    from: 'Delulu Social <noreply@delulu.social>',
    to,
    subject: 'Your verification code',
    html: await render(<VerifyOTP code={code} />),
  });
};
```

#### Send Magic Link

```typescript
export const sendMagicLink = async (
  ctx: ActionCtx,
  { to, url }: { to: string; url: string }
) => {
  await resend.sendEmail(ctx, {
    from: 'Delulu Social <noreply@delulu.social>',
    to,
    subject: 'Sign in to your account',
    html: await render(<MagicLinkEmail url={url} />),
  });
};
```

#### Send Password Reset

```typescript
export const sendResetPassword = async (
  ctx: ActionCtx,
  { to, url }: { to: string; url: string }
) => {
  await resend.sendEmail(ctx, {
    from: 'Delulu Social <noreply@delulu.social>',
    to,
    subject: 'Reset your password',
    html: await render(<ResetPasswordEmail url={url} />),
  });
};
```

## Utility Functions (`utils.ts`)

### Timestamp Utilities

```typescript
export const getCurrentTimestamp = (): number => {
  return Math.floor(Date.now() / 1000);
};

export const addDaysToTimestamp = (timestamp: number, days: number): number => {
  return timestamp + (days * 24 * 60 * 60);
};

export const isTimestampExpired = (timestamp: number): boolean => {
  return timestamp < getCurrentTimestamp();
};
```

### Encryption Utilities

```typescript
export const encryptData = async (data: string): Promise<string> => {
  // Encryption implementation
  return encryptedData;
};

export const decryptData = async (encryptedData: string): Promise<string> => {
  // Decryption implementation
  return decryptedData;
};
```

### Validation Utilities

```typescript
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
```

## Error Handling Patterns

### Standard Error Responses

```typescript
// Not Found
if (!resource) {
  throw new Error('Resource not found');
}

// Validation Error
if (!validateEmail(email)) {
  throw new Error('Invalid email format');
}

// Permission Error
if (resource.userId !== currentUserId) {
  throw new Error('Access denied');
}

// Encryption Error
try {
  const encrypted = await encryptData(data);
} catch (error) {
  console.error('Encryption failed:', error);
  throw new Error('Data processing failed');
}
```

### Retry Patterns

```typescript
const retryWithBackoff = async (operation: () => Promise<any>, maxRetries: number = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

## Performance Considerations

### Query Optimization

1. **Use appropriate indexes** for all query patterns
2. **Implement pagination** for large datasets
3. **Filter early** in the query chain
4. **Sort efficiently** using database indexes
5. **Cache frequently accessed** data

### Batch Operations

```typescript
// Batch create posts
export const batchCreatePosts = mutation({
  args: { posts: v.array(postCreateSchema) },
  returns: v.array(v.id('posts')),
  handler: async (ctx, args) => {
    const now = getCurrentTimestamp();
    const postIds = [];
    
    for (const postData of args.posts) {
      const postId = await ctx.db.insert('posts', {
        ...postData,
        createdAt: now,
        updatedAt: now,
      });
      postIds.push(postId);
    }
    
    return postIds;
  },
});
```

### Memory Management

1. **Limit query results** with pagination
2. **Use streaming** for large datasets
3. **Clean up expired data** regularly
4. **Monitor memory usage** in functions

## Best Practices

### Function Design

1. **Keep functions focused** on single responsibilities
2. **Use descriptive names** and clear documentation
3. **Validate all inputs** with Convex validators
4. **Handle errors gracefully** with meaningful messages
5. **Log important operations** for debugging

### Security

1. **Validate user permissions** before data access
2. **Sanitize inputs** to prevent injection attacks
3. **Use encryption** for sensitive data
4. **Implement rate limiting** for expensive operations
5. **Audit access patterns** regularly

### Testing

1. **Test all function paths** including error cases
2. **Mock external dependencies** for unit tests
3. **Test with realistic data** volumes
4. **Verify security constraints** in tests
5. **Monitor performance** in production