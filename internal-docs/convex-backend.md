# Convex Backend Architecture

## Overview

The Delulu Social backend is built on **Convex**, a real-time database and backend platform that provides:

- Type-safe database operations with TypeScript
- Real-time subscriptions and live queries
- Serverless functions (queries, mutations, actions)
- Built-in authentication and file storage
- Automatic schema validation

## Convex Configuration

### App Configuration (`convex.config.ts`)

```typescript
import { defineApp } from 'convex/server';
import betterAuth from '@convex-dev/better-auth/convex.config';
import resend from '@convex-dev/resend/convex.config';

const app = defineApp();
app.use(betterAuth);  // Authentication component
app.use(resend);      // Email service component

export default app;
```

### Components Used

- **`@convex-dev/better-auth`** - Authentication system integration
- **`@convex-dev/resend`** - Email service integration

## Database Schema

### Schema Organization

The schema is organized into modular files in `/convex/schemas/`:

- **`enums.ts`** - Enum types and basic schemas
- **`auth.ts`** - Authentication related schemas
- **`social_providers.ts`** - Social media provider schemas
- **`posts_media.ts`** - Post and media schemas
- **`utils.ts`** - Utility and response schemas

### Core Tables

#### Users Table

```typescript
users: defineTable({
  name: string,
  email: string,
  emailVerified: boolean,
  image: string?,
  usage: {
    socialAccounts: number,
    generatedPosts: number,
    drafts: number,
    organization: number,
  },
  createdAt: number,
  updatedAt: number,
})
.index('by_email', ['email'])
```

#### Sessions Table

```typescript
sessions: defineTable({
  token: string,
  userId: Id<'users'>,
  expiresAt: number,
  ipAddress: string?,
  userAgent: string?,
  createdAt: number,
  updatedAt: number,
})
.index('by_token', ['token'])
.index('by_user_id', ['userId'])
```

#### Accounts Table

```typescript
accounts: defineTable({
  userId: Id<'users'>,
  accountId: string,
  providerId: string,
  accessToken: string?,
  refreshToken: string?,
  idToken: string?,
  accessTokenExpiresAt: number?,
  refreshTokenExpiresAt: number?,
  scope: string?,
  password: string?,
  createdAt: number,
  updatedAt: number,
})
.index('by_user_id', ['userId'])
.index('by_provider_and_account', ['providerId', 'accountId'])
```

#### Posts Table

```typescript
posts: defineTable({
  userId: Id<'users'>?,
  status: 'SAVED' | 'PUBLISHED' | 'SCHEDULED' | 'DELETED' | 'FAILED',
  scheduledAt: number?,
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED',
  organizationId: string?,
  isDeleted: boolean,
  postFailureReason: string?,
  privacyStatus: 'PUBLIC' | 'PRIVATE' | 'UNLISTED',
  content: ContentSchema[],
  alternativeContent: AlternativeContentSchema[]?,
  socialProviderIds: Id<'socialProviders'>[],
  platformPosts: EmbeddedPlatformPostSchema[]?,
  createdAt: number,
  updatedAt: number,
  publishedAt: number?,
  lastFailedAt: number?,
  retryCount: number,
})
.index('by_user_id', ['userId'])
.index('by_organization_id', ['organizationId'])
.index('by_status', ['status'])
.index('by_scheduled_at', ['scheduledAt'])
.index('by_created_at', ['createdAt'])
```

#### Social Providers Table

```typescript
socialProviders: defineTable({
  organizationId: string?,
  userId: Id<'users'>?,
  accessToken: string,
  refreshToken: string?,
  expiresIn: number,
  refreshTokenExpiresIn: number?,
  profileId: string,
  username: string?,
  fullName: string,
  profileImage: string,
  socialType: SocialTypeSchema,
  createdAt: number,
  updatedAt: number,
  isActive: boolean,
  lastSyncedAt: number?,
})
.index('by_user_id', ['userId'])
.index('by_organization_id', ['organizationId'])
.index('by_profile_id', ['profileId'])
.index('by_social_type', ['socialType'])
.index('by_is_active', ['isActive'])
```

#### Media Table

```typescript
media: defineTable({
  userId: Id<'users'>,
  organizationId: string?,
  bucketKey: string,
  url: string,
  mediaType: 'IMAGE' | 'VIDEO',
  originalFilename: string?,
  size: number?,
  extension: string?,
  altText: string?,
  bucketUrl: string?,
  thumbnailBucketUrl: string?,
  thumbnailBucketKey: string?,
  createdAt: number,
  updatedAt: number,
})
.index('by_user_id', ['userId'])
.index('by_organization_id', ['organizationId'])
.index('by_bucket_key', ['bucketKey'])
.index('by_media_type', ['mediaType'])
.index('by_created_at', ['createdAt'])
```

### Embedded Schemas

#### Content Schema

```typescript
content: {
  id: string?,
  order: number,
  name: string,
  media: MediaSchema[],
  text: string,
  tags: string[]?,
  socialId: string?,
}
```

#### Media Schema

```typescript
media: {
  url: string?,
  mediaType: 'IMAGE' | 'VIDEO',
  bucketUrl: string?,
  bucketKey: string?,
  altText: string?,
  thumbnailBucketUrl: string?,
  thumbnailBucketKey: string?,
}
```

#### Platform Post Schema

```typescript
platformPost: {
  socialProviderId: Id<'socialProviders'>,
  platformPostId: string?,
  platformPostUrl: string?,
  postedAt: number?,
  failureReason: string?,
  createdAt: number,
  updatedAt: number,
}
```

## Supported Social Types

```typescript
type SocialType = 
  | 'TWITTER'
  | 'LINKEDIN' 
  | 'LENS'
  | 'YOUTUBE'
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'TIKTOK'
  | 'THREADS'
  | 'PINTEREST'
  | 'FARCASTER'
  | 'BLUESKY'
```

## Index Strategy

### Query Optimization

- **Primary lookups**: `by_id` (automatic)
- **User-scoped queries**: `by_user_id` indexes
- **Organization-scoped queries**: `by_organization_id` indexes
- **Status filtering**: `by_status`, `by_is_active` indexes
- **Time-based queries**: `by_created_at`, `by_scheduled_at` indexes
- **Composite lookups**: `by_profile_id_and_user`, `by_provider_and_account`

### Performance Considerations

- All timestamps stored as Unix timestamps (numbers)
- Embedded relationships reduce joins
- Strategic indexes for common query patterns
- Pagination support with offset/limit

## File Structure

```
convex/
├── _generated/           # Auto-generated Convex files
├── schemas/             # Schema definitions
│   ├── index.ts        # Main schema exports
│   ├── enums.ts        # Enum types and basic schemas
│   ├── auth.ts         # Authentication schemas
│   ├── social_providers.ts  # Social provider schemas
│   ├── posts_media.ts  # Post and media schemas
│   └── utils.ts        # Utility schemas
├── emails/             # Email templates and functions
├── auth.ts             # Authentication functions
├── users.ts            # User management functions
├── posts.ts            # Post management functions
├── social_providers.ts # Social provider functions
├── media.ts            # Media management functions
├── cascade_deletes.ts  # Cascade delete operations
├── utils.ts            # Utility functions
├── schema.ts           # Main schema definition
├── convex.config.ts    # Convex app configuration
└── polyfills.ts        # Email rendering polyfills
```

## TypeScript Integration

### Schema Validation

All schemas use Convex's built-in validation with TypeScript types:

```typescript
import { v } from 'convex/values';

export const userSchema = v.object({
  name: v.string(),
  email: v.string(),
  emailVerified: v.boolean(),
  // ... other fields
});
```

### Generated Types

Convex automatically generates TypeScript types for:

- Database document types
- Function arguments and return types
- API endpoints
- Schema validation

### Cross-Package Imports

The schema system supports importing from other packages:

```typescript
// Importing email templates from @delulu/email package
import { VerifyEmail, MagicLinkEmail } from '@delulu/email';
```

## Best Practices

### Schema Design

1. **Embedded vs. Relational**: Use embedded objects for 1:1 relationships, separate tables for 1:many
2. **Indexes**: Create indexes for all common query patterns
3. **Timestamps**: Use Unix timestamps for consistency
4. **Validation**: Use Convex validators for all fields

### Query Patterns

1. **Pagination**: Always use limit/offset for large datasets
2. **Filtering**: Use indexed fields for filtering
3. **Real-time**: Leverage Convex's real-time subscriptions
4. **Batch Operations**: Use transactions for multi-table operations

### Error Handling

1. **Validation**: Schema validation happens automatically
2. **Null Checks**: Use optional fields and proper null handling
3. **Cascade Operations**: Use dedicated cascade functions for data integrity
4. **Retry Logic**: Implement retry patterns for external API calls