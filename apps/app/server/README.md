# Server Actions Migration Guide

This directory contains Next.js server actions that provide the same functionality as the existing tRPC endpoints, while keeping tRPC intact for gradual migration.

## Architecture

```
server/
├── types.ts              # Shared types and response wrappers
├── utils.ts               # Authentication and error handling utilities
├── media.ts               # Media-related server actions
├── social-providers.ts    # Social provider server actions
├── general.ts             # General/utility server actions
├── index.ts               # Centralized exports
└── README.md              # This file
```

## Usage with TanStack Query Hooks

Instead of using server actions directly, use the provided TanStack Query hooks for better client-side experience:

```typescript
import { useGetUserMedia, useCreateMedia } from '@/hooks/use-media';
import { useCreatePost } from '@/hooks/use-social-providers';

// Query usage
const { data, isLoading, error } = useGetUserMedia({
  limit: 20,
  search: 'vacation photos'
});

// Mutation usage
const createMedia = useCreateMedia({
  onSuccess: (data) => console.log('Created:', data),
  onError: (error) => console.error('Failed:', error)
});

createMedia.mutate({
  bucketKey: 'photo-123',
  url: 'https://example.com/photo.jpg',
  mediaType: 'IMAGE'
});
```

## Available Hooks

### Media Hooks (`@/hooks/use-media`)
- `useGetUserMedia(params)` - Get paginated user media
- `useGetMediaById(id)` - Get specific media item
- `useGetMediaByBucketKey(key)` - Get media by bucket key
- `useGetMediaStats()` - Get media statistics
- `useCreateMedia(options)` - Create new media
- `useUpdateMedia(options)` - Update existing media
- `useDeleteMedia(options)` - Delete media

### Social Provider Hooks (`@/hooks/use-social-providers`)
- `useGetSocialProviderConnectUrl(options)` - Get OAuth connect URL
- `useCreatePost(options)` - Create/publish post
- `useCreatePostFromPostId(options)` - Republish existing post
- `useConnectFacebookPage(options)` - Connect Facebook page

### General Hooks (`@/hooks/use-general`)
- `useHello(options)` - Test endpoint

## Server Action Functions

### Media Actions
```typescript
import { getUserMedia, createMedia, updateMedia, deleteMedia } from '@/server/media';

// All return ServerActionResult<T>
const result = await getUserMedia({ limit: 10, mediaType: 'IMAGE' });
if (result.success) {
  console.log(result.data); // MediaQueryResult
} else {
  console.error(result.error); // string
}
```

### Social Provider Actions
```typescript
import { createPost, connectFacebookPage } from '@/server/social-providers';

const postResult = await createPost({
  content: 'Hello world!',
  socialProviders: [{ socialId: 'provider-123' }],
  alternativeContent: []
});
```

## Response Format

All server actions return a standardized response:

```typescript
type ServerActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
```

## Authentication

Authentication is handled automatically by the `withAuth` wrapper:
- Uses Clerk for user authentication
- Validates user exists in Convex database
- Passes user ID to action functions
- Returns appropriate errors for unauthorized access

## Error Handling

- All errors are caught and returned as `ServerActionResult`
- Development errors are logged to console
- Client-friendly error messages are returned
- TanStack Query hooks automatically throw errors for failed actions

## Migration Strategy

1. **Keep tRPC intact** - No changes to existing tRPC setup
2. **Use hooks** - Always use TanStack Query hooks instead of direct server actions
3. **Gradual adoption** - Replace tRPC usage component by component
4. **Test thoroughly** - Each server action mirrors its tRPC equivalent

## Type Safety

- Full TypeScript support with proper type inference
- Input validation using existing Zod schemas
- Convex type safety with proper ID casting
- TanStack Query provides additional runtime type safety

## Performance Benefits

- **Automatic caching** - TanStack Query provides intelligent caching
- **Background updates** - Queries refetch in background when stale
- **Optimistic updates** - Mutations can update cache optimistically
- **Request deduplication** - Multiple identical requests are deduplicated
- **Automatic retries** - Failed requests are automatically retried

## Example Usage

See `/components/examples/server-action-example.tsx` for a complete example showing:
- Query usage with loading and error states
- Mutation usage with success/error callbacks
- Search functionality with query parameters
- Automatic cache invalidation

## Next Steps

1. Start using the hooks in components that need the functionality
2. Gradually replace tRPC usage with server action hooks
3. Monitor performance and user experience
4. Eventually remove tRPC when fully migrated (future step)