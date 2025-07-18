# Social Providers & OAuth Integration

## Overview

The social providers system manages OAuth connections to multiple social media platforms, enabling users to schedule and publish content across different networks.

## Supported Platforms

### Current Integrations

- **Twitter/X** - Posts, threads, and media
- **LinkedIn** - Professional posts and articles
- **Instagram** - Photos, videos, and stories
- **Facebook** - Posts and page management
- **TikTok** - Short-form video content
- **Pinterest** - Pin creation and board management
- **Threads** - Meta's text-based platform
- **Farcaster** - Decentralized social protocol
- **Bluesky** - Decentralized social network
- **Lens** - Web3 social protocol
- **YouTube** - Video uploads and management

## Database Schema

### Social Providers Table

```typescript
socialProviders: defineTable({
  organizationId: string?,
  userId: Id<'users'>?,
  accessToken: string,        // Encrypted
  refreshToken: string?,      // Encrypted
  expiresIn: number,          // Unix timestamp
  refreshTokenExpiresIn: number?,
  profileId: string,
  username: string?,
  fullName: string,
  profileImage: string,
  socialType: SocialType,
  createdAt: number,
  updatedAt: number,
  isActive: boolean,
  lastSyncedAt: number?,
})
```

### Indexes

- `by_user_id` - Get all providers for a user
- `by_organization_id` - Get all providers for an organization
- `by_profile_id` - Find provider by platform profile ID
- `by_social_type` - Filter by platform type
- `by_is_active` - Filter active/inactive providers

## Token Security

### Encryption

All OAuth tokens are encrypted before storage:

```typescript
// Creation with encryption
const encryptedAccessToken = await encryptData(args.accessToken);
const encryptedRefreshToken = args.refreshToken
  ? await encryptData(args.refreshToken)
  : undefined;

await ctx.db.insert('socialProviders', {
  accessToken: encryptedAccessToken,
  refreshToken: encryptedRefreshToken,
  // ... other fields
});
```

### Decryption for API Calls

```typescript
// Internal function to get decrypted tokens
export const getSocialProviderWithDecryptedTokens = internalQuery({
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.id);
    
    const decryptedAccessToken = await decryptData(provider.accessToken);
    const decryptedRefreshToken = provider.refreshToken
      ? await decryptData(provider.refreshToken)
      : undefined;
    
    return {
      ...provider,
      accessToken: decryptedAccessToken,
      refreshToken: decryptedRefreshToken,
    };
  },
});
```

## OAuth Flow Implementation

### General OAuth Flow

1. **User initiates connection** to social platform
2. **Redirect to OAuth provider** with required scopes
3. **User authorizes** application access
4. **OAuth provider redirects** back with authorization code
5. **Exchange code for tokens** via platform API
6. **Store encrypted tokens** in Convex database
7. **Sync user profile** information

### Platform-Specific Callbacks

Each platform has its own callback route:

```
/api/callback/twitter/
/api/callback/linkedin/
/api/callback/instagram/
/api/callback/facebook/
/api/callback/tiktok/
/api/callback/pinterest/
/api/callback/threads/
/api/callback/bluesky/
/api/callback/farcaster/
```

## Platform-Specific Configurations

### Twitter/X Integration

```typescript
// Required scopes
const scopes = ['tweet.read', 'tweet.write', 'users.read'];

// Profile sync
{
  profileId: user.id,
  username: user.username,
  fullName: user.name,
  profileImage: user.profile_image_url,
  socialType: 'TWITTER',
}
```

### LinkedIn Integration

```typescript
// Required scopes
const scopes = ['r_liteprofile', 'w_member_social'];

// Profile sync
{
  profileId: profile.id,
  username: null, // LinkedIn doesn't have usernames
  fullName: profile.firstName + ' ' + profile.lastName,
  profileImage: profile.profilePicture,
  socialType: 'LINKEDIN',
}
```

### Instagram Integration

```typescript
// Required scopes
const scopes = ['instagram_basic', 'instagram_content_publish'];

// Profile sync
{
  profileId: user.id,
  username: user.username,
  fullName: user.name,
  profileImage: user.profile_picture_url,
  socialType: 'INSTAGRAM',
}
```

### Facebook Integration

```typescript
// Required scopes
const scopes = ['pages_manage_posts', 'pages_read_engagement'];

// Profile sync (for pages)
{
  profileId: page.id,
  username: null,
  fullName: page.name,
  profileImage: page.picture?.data?.url,
  socialType: 'FACEBOOK',
}
```

### TikTok Integration

```typescript
// Required scopes
const scopes = ['user.info.basic', 'video.publish'];

// Profile sync
{
  profileId: user.open_id,
  username: user.username,
  fullName: user.display_name,
  profileImage: user.avatar_url,
  socialType: 'TIKTOK',
}
```

## API Functions

### Query Functions

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

#### Get User's Social Providers

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
    
    // Sort by creation date (newest first)
    providers.sort((a, b) => b.createdAt - a.createdAt);
    
    return providers;
  },
});
```

#### Get Organization's Social Providers

```typescript
export const getOrganizationSocialProviders = query({
  args: { organizationId: v.string() },
  returns: v.array(socialProviderSchema),
  handler: async (ctx, args) => {
    return await ctx.db
      .query('socialProviders')
      .withIndex('by_organization_id', (q) => 
        q.eq('organizationId', args.organizationId)
      )
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();
  },
});
```

#### Get Expired Tokens

```typescript
export const getExpiredTokens = query({
  args: {},
  returns: v.array(socialProviderSchema),
  handler: async (ctx, args) => {
    const now = getCurrentTimestamp();
    
    return await ctx.db
      .query('socialProviders')
      .withIndex('by_is_active', (q) => q.eq('isActive', true))
      .filter((q) => q.lt(q.field('expiresIn'), now))
      .collect();
  },
});
```

### Mutation Functions

#### Create Social Provider

```typescript
export const createSocialProvider = mutation({
  args: socialProviderCreateSchema.fields,
  returns: v.id('socialProviders'),
  handler: async (ctx, args) => {
    // Encrypt tokens before storing
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
    
    // Update other fields
    Object.assign(updateData, args);
    
    await ctx.db.patch(provider._id, updateData);
    return true;
  },
});
```

#### Deactivate Social Provider

```typescript
export const deactivateSocialProvider = mutation({
  args: { id: v.id('socialProviders') },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.id);
    if (!provider) {
      throw new Error('Social provider not found');
    }
    
    await ctx.db.patch(provider._id, {
      isActive: false,
      updatedAt: getCurrentTimestamp(),
    });
    
    return true;
  },
});
```

#### Delete Social Provider

```typescript
export const deleteSocialProvider = mutation({
  args: { id: v.id('socialProviders') },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.id);
    if (!provider) {
      throw new Error('Social provider not found');
    }
    
    // Clean up posts that reference this provider
    await ctx.runMutation(
      api.cascade_deletes.cleanupPostsForDeletedSocialProvider,
      { socialProviderId: args.id }
    );
    
    // Delete the provider
    await ctx.db.delete(provider._id);
    return true;
  },
});
```

## Token Management

### Token Refresh

```typescript
export const refreshSocialProviderToken = mutation({
  args: { id: v.id('socialProviders') },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const provider = await ctx.runQuery(
      api.social_providers.getSocialProviderWithDecryptedTokens,
      { id: args.id }
    );
    
    if (!provider || !provider.refreshToken) {
      throw new Error('Provider not found or no refresh token');
    }
    
    // Platform-specific token refresh logic
    const newTokens = await refreshTokenForPlatform(
      provider.socialType,
      provider.refreshToken
    );
    
    // Update with new encrypted tokens
    await ctx.runMutation(api.social_providers.updateSocialProvider, {
      id: args.id,
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      expiresIn: newTokens.expiresIn,
    });
    
    return true;
  },
});
```

### Sync Tracking

```typescript
export const updateSocialProviderSync = mutation({
  args: { id: v.id('socialProviders') },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.id);
    if (!provider) {
      throw new Error('Social provider not found');
    }
    
    await ctx.db.patch(provider._id, {
      lastSyncedAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    });
    
    return true;
  },
});
```

## Cascade Delete Operations

### Post Cleanup

When a social provider is deleted, all references must be cleaned up:

```typescript
export const cleanupPostsForDeletedSocialProvider = internalMutation({
  args: { socialProviderId: v.id('socialProviders') },
  returns: v.number(),
  handler: async (ctx, args) => {
    const posts = await ctx.db.query('posts').collect();
    let updatedPostsCount = 0;
    
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
        const filtered = post.alternativeContent.filter(
          (alt) => alt.socialProviderId !== args.socialProviderId
        );
        
        if (filtered.length !== post.alternativeContent.length) {
          updateData.alternativeContent = filtered.length > 0 ? filtered : undefined;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        updateData.updatedAt = getCurrentTimestamp();
        await ctx.db.patch(post._id, updateData);
        updatedPostsCount++;
      }
    }
    
    return updatedPostsCount;
  },
});
```

## Error Handling

### Common Error Scenarios

1. **Token Encryption Failure**
   - Cause: Encryption service unavailable
   - Solution: Retry with exponential backoff

2. **OAuth Flow Interruption**
   - Cause: User cancels authorization
   - Solution: Graceful error handling and retry option

3. **Token Expiration**
   - Cause: Natural token expiration
   - Solution: Automatic refresh using refresh token

4. **Platform API Changes**
   - Cause: Social platform updates API
   - Solution: Version-specific handling and fallbacks

### Error Recovery

```typescript
try {
  const encryptedToken = await encryptData(token);
  // ... store token
} catch (error) {
  console.error('Token encryption failed:', error);
  
  // Retry with exponential backoff
  const retryDelays = [1000, 2000, 4000, 8000];
  for (const delay of retryDelays) {
    await new Promise(resolve => setTimeout(resolve, delay));
    try {
      const encryptedToken = await encryptData(token);
      // ... store token
      break;
    } catch (retryError) {
      if (delay === retryDelays[retryDelays.length - 1]) {
        throw new Error('Token encryption failed after retries');
      }
    }
  }
}
```

## Security Best Practices

### Token Security

1. **Always encrypt tokens** before database storage
2. **Use secure key management** for encryption keys
3. **Implement token rotation** for long-lived connections
4. **Monitor token usage** for anomalies

### OAuth Security

1. **Validate state parameters** to prevent CSRF attacks
2. **Use HTTPS** for all OAuth redirects
3. **Implement proper scope validation**
4. **Store minimal required permissions**

### Access Control

1. **Verify user ownership** before returning providers
2. **Implement organization-level access** controls
3. **Audit provider access** and usage patterns
4. **Use secure session management**

## Performance Optimization

### Database Queries

1. **Use appropriate indexes** for common query patterns
2. **Implement pagination** for large result sets
3. **Cache frequently accessed** provider data
4. **Optimize token decryption** for bulk operations

### API Rate Limiting

1. **Respect platform rate limits** for each provider
2. **Implement exponential backoff** for API calls
3. **Use batch operations** where supported
4. **Monitor API usage** and quotas

## Monitoring and Maintenance

### Health Checks

1. **Monitor token expiration** and refresh automatically
2. **Track API success rates** for each platform
3. **Alert on encryption failures** or other critical errors
4. **Audit provider connections** regularly

### Maintenance Tasks

1. **Clean up expired tokens** periodically
2. **Update platform integrations** when APIs change
3. **Review and rotate encryption keys** regularly
4. **Monitor platform policy changes** and compliance