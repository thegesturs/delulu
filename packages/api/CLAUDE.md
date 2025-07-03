# Neverthrow Implementation Guide for Social Media Providers

## Overview

This document outlines the standardized approach for implementing neverthrow error handling across all social media providers in the `/packages/api/providers` directory. The goal is to eliminate all `throw` statements and `try-catch` blocks in favor of functional error handling using the `Result<T, E>` pattern.

## Core Principles

1. **Never Throw**: All functions return `Result<T, SocialProviderError>` or `ResultAsync<T, SocialProviderError>`
2. **Type-Safe Errors**: Use custom error classes that extend `SocialProviderError`
3. **Functional Composition**: Chain operations using `.andThen()`, `.map()`, and other neverthrow utilities
4. **Early Returns**: Use `errAsync()` for immediate error returns in async functions
5. **Promise Conversion**: Use `ResultAsync.fromPromise()` to wrap third-party API calls

## Error Type Hierarchy

All errors inherit from `SocialProviderError` defined in `./errors.ts`:

```typescript
// Base error class
export abstract class SocialProviderError extends Error {
  abstract readonly code: string;
  abstract readonly provider: string;
}

// Specific error types
- ProfileNotFoundError
- InvalidMediaError
- MediaUploadError
- MediaProcessingError
- MediaProcessingTimeoutError
- PublishError
- APIError
- NetworkError
- Platform-specific errors (FacebookError, ThreadsError, etc.)
```

## Key Neverthrow Patterns

### 1. Early Error Returns

```typescript
const validateInput = (data: any): ResultAsync<ValidData, SocialProviderError> => {
  if (!data.url) {
    return errAsync(new InvalidMediaError('Facebook', 'URL is required'));
  }
  
  // Continue with processing...
  return okAsync(processedData);
};
```

### 2. Wrapping Third-Party API Calls

```typescript
const apiCall = (): ResultAsync<APIResponse, SocialProviderError> => {
  return ResultAsync.fromPromise(
    axios.post(endpoint, data),
    (error) => createAPIError('Facebook', error)
  );
};
```

### 3. Function Composition

```typescript
const processMedia = (media: MediaType): ResultAsync<string, SocialProviderError> => {
  return validateMedia(media)
    .andThen(validMedia => uploadMedia(validMedia))
    .andThen(uploadResult => processUpload(uploadResult))
    .map(result => result.id);
};
```

### 4. Combining Multiple Async Operations

```typescript
const processMultipleMedia = (mediaList: MediaType[]): ResultAsync<string[], SocialProviderError> => {
  return ResultAsync.combine(
    mediaList.map(media => processMedia(media))
  );
};
```

### 5. Converting ResultAsync to Promise for Provider Interface

```typescript
export const provider: SocialProvider = {
  publish: async ({ content, socialProviderId }) => {
    const result = await getProfile(socialProviderId)
      .andThen(profile => publishContent(content, profile));
    return result;
  }
};
```

## Function Architecture Patterns

### Small, Focused Functions

Break complex operations into smaller, composable functions:

```typescript
// ❌ Bad: Large, complex function
const publishPost = async (content, profile) => {
  try {
    // 50+ lines of mixed logic
  } catch (error) {
    throw error;
  }
};

// ✅ Good: Small, focused functions
const validateContent = (content): ResultAsync<ValidContent, SocialProviderError> => { /* ... */ };
const processMedia = (media): ResultAsync<string[], SocialProviderError> => { /* ... */ };
const createPost = (data): ResultAsync<PostResponse, SocialProviderError> => { /* ... */ };
const getPostDetails = (postId): ResultAsync<PostDetails, SocialProviderError> => { /* ... */ };

const publishPost = (content, profile): ResultAsync<PostReturnType, SocialProviderError> => {
  return validateContent(content)
    .andThen(validContent => processMedia(validContent.media))
    .andThen(mediaIds => createPost({ ...validContent, mediaIds }))
    .andThen(postResponse => getPostDetails(postResponse.id))
    .map(postDetails => formatResult(postDetails, profile));
};
```

### Profile Management Pattern

```typescript
const getProfile = (socialProviderId: string): ResultAsync<FacebookProfile, SocialProviderError> =>
  ResultAsync.fromPromise(
    database.query.socialProviders.findMany({
      where: (socialProviders, { eq }) => eq(socialProviders.id, socialProviderId),
      limit: 1,
    }),
    () => new FacebookError('Database query failed')
  ).andThen(([profile]) => {
    if (!profile?.accessToken || !profile.profileId) {
      return err(new ProfileNotFoundError('Facebook'));
    }
    return ok({
      id: profile.id,
      profileId: profile.profileId,
      accessToken: profile.accessToken,
    });
  });
```

### Polling Pattern for Async Operations

```typescript
const waitForProcessing = (
  resourceId: string,
  accessToken: string,
  maxAttempts = 30,
  interval = 10000
): ResultAsync<void, SocialProviderError> => {
  const poll = async (attempts: number): Promise<void> => {
    if (attempts >= maxAttempts) {
      throw new MediaProcessingTimeoutError('Facebook');
    }

    const statusResult = await checkStatus(resourceId, accessToken);
    if (statusResult.isErr()) {
      throw statusResult.error;
    }

    const status = statusResult.value;
    
    if (status.isComplete) {
      return;
    }

    if (status.hasError) {
      throw new MediaProcessingError('Facebook', status.errorMessage);
    }

    await new Promise(resolve => setTimeout(resolve, interval));
    return poll(attempts + 1);
  };

  return ResultAsync.fromPromise(poll(0), (error) => error as SocialProviderError);
};
```

## Common Mistakes to Avoid

### 1. ❌ Mixing try-catch with neverthrow
```typescript
// Don't do this
const badFunction = async () => {
  try {
    const result = await someResultAsync();
    return ok(result);
  } catch (error) {
    return err(error);
  }
};
```

### 2. ❌ Using _unsafeUnwrap() in production
```typescript
// Don't do this
const value = result._unsafeUnwrap(); // Unsafe!

// Do this instead
return result.andThen(value => processValue(value));
```

### 3. ❌ Returning nested Results
```typescript
// Don't do this
return ResultAsync.fromSafePromise(Promise.resolve(err(error)));

// Do this instead
return errAsync(error);
```

### 4. ❌ Incorrect Promise handling
```typescript
// Don't do this
.match(
  (success) => Promise.resolve(ok(success)),
  (error) => Promise.resolve(err(error))
);

// Do this instead
const result = await resultAsync;
return result;
```

## File Structure Template

Each provider should follow this structure:

```typescript
// 1. Imports
import { ok, err, okAsync, errAsync, ResultAsync } from 'neverthrow';
import { SocialProviderError, SpecificError } from './errors';

// 2. Types and Interfaces
interface ProviderProfile { /* ... */ }
interface APIResponse { /* ... */ }

// 3. Pure utility functions
const createParams = (data) => ({ /* ... */ });

// 4. Core business logic functions
const getProfile = (): ResultAsync<Profile, SocialProviderError> => { /* ... */ };
const uploadMedia = (): ResultAsync<string, SocialProviderError> => { /* ... */ };
const createPost = (): ResultAsync<PostResponse, SocialProviderError> => { /* ... */ };

// 5. Main composition function
const publishContent = (): ResultAsync<PostReturnType, SocialProviderError> => { /* ... */ };

// 6. Provider export
export const provider: SocialProvider = {
  publish: async ({ content, socialProviderId }) => {
    const result = await getProfile(socialProviderId)
      .andThen(profile => publishContent(content, profile));
    return result;
  },
  connectUrl: () => ok(generateOAuthUrl())
};
```

## Testing Strategy

All functions should be easily testable since they return Results:

```typescript
describe('uploadMedia', () => {
  it('should return error for invalid URL', async () => {
    const result = await uploadMedia(invalidMedia, profile);
    expect(result.isErr()).toBe(true);
    expect(result.error).toBeInstanceOf(InvalidMediaError);
  });

  it('should upload media successfully', async () => {
    const result = await uploadMedia(validMedia, profile);
    expect(result.isOk()).toBe(true);
    expect(result.value).toMatch(/^media_id_/);
  });
});
```

## Migration Checklist

When converting a provider to neverthrow:

- [ ] Replace all `throw` statements with `errAsync()` or `err()`
- [ ] Replace all `try-catch` blocks with `ResultAsync.fromPromise()`
- [ ] Update function return types to `ResultAsync<T, SocialProviderError>`
- [ ] Break large functions into smaller, focused ones
- [ ] Use proper error types from `./errors.ts`
- [ ] Ensure main publish function uses only `.andThen()` chaining
- [ ] Update provider export to handle async results properly
- [ ] Add proper TypeScript types for all interfaces
- [ ] Test all error paths and success paths

## Benefits Achieved

1. **Type Safety**: All errors are typed and visible in function signatures
2. **Composability**: Functions can be easily chained and combined
3. **Testability**: Pure functions are easy to unit test
4. **Maintainability**: Clear separation of concerns and error handling
5. **Reliability**: No hidden exceptions or unhandled errors
6. **Developer Experience**: IDE provides better autocomplete and error detection

This approach ensures consistent, reliable error handling across all social media providers while maintaining code readability and maintainability.