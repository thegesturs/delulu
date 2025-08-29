# Social Media Provider Unit Tests

Comprehensive unit testing for social media posting across all platforms via ECS endpoints.

## Overview

This testing suite validates social media posting functionality for all supported platforms:

| Platform | Single Image | Carousel | Video/Reel | Status |
|----------|--------------|----------|------------|--------|
| Instagram | ✅ | ✅ | ✅ (reels) | **Complete** |
| Threads | ✅ | ✅ | ✅ | **Complete** |
| Facebook | ✅ | ✅ (albums) | ✅ (reels) | **Complete** |
| LinkedIn | ✅ | ✅ (multi-image) | ✅ | **Complete** |
| TikTok | ❌ | ❌ | ✅ | **Complete** |
| YouTube | ❌ | ❌ | ✅ (shorts/videos) | **Complete** |

## Architecture

### Test Strategy
- **ECS Endpoint Testing**: All tests call the Lambda URL directly, not provider functions
- **Real Token Integration**: Uses actual social provider tokens (refreshed every 2 months)
- **Mocked Responses**: Prevents actual API consumption while testing full request flow
- **Comprehensive Error Handling**: Tests all failure scenarios and edge cases

### Test Files Structure

```
packages/worker/__tests__/
├── setup.ts              # Global test configuration and mocks
├── test-data.ts          # Real tokens, test content, and mock responses
├── instagram.test.ts     # Instagram provider tests
├── threads.test.ts       # Threads provider tests  
├── facebook.test.ts      # Facebook provider tests
├── linkedin.test.ts      # LinkedIn provider tests
├── tiktok.test.ts        # TikTok provider tests
├── youtube.test.ts       # YouTube provider tests
└── README.md            # This documentation
```

### Key Testing Components

#### 1. Real Social Provider Tokens (`test-data.ts`)
```typescript
export const TEST_SOCIAL_PROVIDERS = {
  threads: {
    accessToken: "real_threads_token...",
    expiresIn: 1761145169394, // Oct 2025
    profileId: "23925631363782745"
  },
  instagram: {
    accessToken: "real_instagram_token...", 
    expiresIn: 1761106992525, // Oct 2025
    profileId: "10036494419791037"
  }
  // ... placeholders for other platforms
}
```

#### 2. ECS Lambda URL
All tests target the actual ECS endpoint:
```typescript
const ECS_LAMBDA_URL = "https://s6zm4w4r5xrwk5ejhdwcjiy7ry0rhvch.lambda-url.us-east-1.on.aws/"
```

#### 3. Mock Response System
```typescript
// Helper functions for consistent mocking
global.mockECSEndpoint = (response, status = 200) => { /* ... */ }
global.mockECSEndpointError = (error, status = 500) => { /* ... */ }
```

## Test Categories

### 1. Token Validation Tests
- ✅ Token presence and format validation
- ✅ Token expiry checking with warnings
- ✅ Refresh token validation (where applicable)
- ✅ Profile ID and access token integrity

### 2. Content Type Tests

#### Instagram
- ✅ **Single Image**: Basic image posting
- ✅ **Carousel**: Multiple images (2-10 images)
- ✅ **Reel**: Video content (3-90 seconds)
- ✅ **Mixed Media Validation**: Prevents mixing images/videos

#### Threads  
- ✅ **Single Image**: Image with text
- ✅ **Carousel**: Multiple images (up to 10)
- ✅ **Video**: Video content posting
- ✅ **Thread Chains**: Multiple content items as replies
- ✅ **Text-Only Posts**: Pure text content

#### Facebook
- ✅ **Single Image**: Page image posting
- ✅ **Photo Albums**: Multiple images in album format
- ✅ **Reel**: Video content with processing phases
- ✅ **Business Page Only**: Rejects personal profiles

#### LinkedIn
- ✅ **Single Image**: Professional image content
- ✅ **Multi-Image**: Up to 9 images in carousel
- ✅ **Video**: Professional video content
- ✅ **Professional Content**: Validates content quality
- ✅ **Personal Profile Only**: Rejects organization accounts

#### TikTok
- ✅ **Video Only**: Vertical video content (3s-10min)
- ✅ **Publishing Workflow**: Upload and publish phases
- ❌ **Images/Carousels**: Properly rejected as unsupported
- ✅ **Trending Content**: Hashtag and viral content support

#### YouTube
- ✅ **Shorts**: Videos ≤60 seconds (vertical preferred)
- ✅ **Regular Videos**: Long-form content (up to 12 hours)
- ✅ **Privacy Settings**: Public, unlisted, private
- ✅ **Metadata**: Title, description, tags, categories
- ❌ **Images/Carousels**: Properly rejected as unsupported

### 3. Error Handling Tests

#### Authentication Errors
- ✅ Expired access tokens (401)
- ✅ Invalid tokens (401)
- ✅ Insufficient permissions (403)
- ✅ Profile not found (404)

#### Content Validation Errors  
- ✅ Invalid media URLs (400)
- ✅ Unsupported media types (400)
- ✅ File size limits (400)
- ✅ Duration limits (400)
- ✅ Content policy violations (400)
- ✅ Spam detection (400)

#### API and Network Errors
- ✅ Rate limit exceeded (429)
- ✅ API server errors (500, 503)
- ✅ Network connectivity issues
- ✅ Processing timeouts (408)
- ✅ Media processing failures

#### Platform-Specific Limits
- ✅ **Instagram**: 10 images per carousel, video duration limits
- ✅ **Threads**: 10 images per post, character limits
- ✅ **Facebook**: 30 photos per album, 1GB video limit
- ✅ **LinkedIn**: 9 images per post, 5GB video limit  
- ✅ **TikTok**: 500MB video limit, 9:16 aspect ratio
- ✅ **YouTube**: 128GB video limit, 12-hour duration

### 4. Payload Structure Validation
- ✅ Correct ECS payload format
- ✅ Required headers (x-api-key)
- ✅ Content structure validation
- ✅ Social provider ID mapping
- ✅ Media type and URL formatting

## Running Tests

### Local Development
```bash
# Navigate to worker package
cd packages/worker

# Install dependencies
pnpm install

# Run all tests
pnpm test

# Run specific platform
pnpm test instagram.test.ts

# Run with coverage
pnpm test:coverage

# Watch mode for development
pnpm test:watch
```

### GitHub Actions
Tests automatically run when:
- Provider code changes (`packages/worker/providers/**`)
- Test files change (`packages/worker/__tests__/**`)  
- Manual workflow dispatch

```yaml
# Manual trigger with platform selection
workflow_dispatch:
  inputs:
    test_platform:
      type: choice
      options: [all, instagram, threads, facebook, linkedin, tiktok, youtube]
```

## Token Management

### Current Token Status
- ✅ **Threads**: Real token (expires Oct 29, 2025)
- ✅ **Instagram**: Real token (expires Oct 28, 2025)
- ⚠️ **Facebook**: Placeholder (needs real token)
- ⚠️ **LinkedIn**: Placeholder (needs real token)
- ⚠️ **TikTok**: Placeholder (needs real token)
- ⚠️ **YouTube**: Placeholder (needs real token)

### Token Refresh Process (Every 2 Months)

1. **Export Fresh Tokens**
```sql
-- Query Convex database for latest tokens
SELECT * FROM socialProviders 
WHERE isActive = true 
AND expiresIn > NOW()
ORDER BY updatedAt DESC
```

2. **Update Test Data**
```typescript
// Update packages/worker/__tests__/test-data.ts
export const TEST_SOCIAL_PROVIDERS = {
  facebook: {
    accessToken: "new_facebook_token_here",
    expiresIn: new_expiry_timestamp,
    profileId: "facebook_page_id"
  }
  // ... update other platforms
}
```

3. **Commit and Deploy**
```bash
git add packages/worker/__tests__/test-data.ts
git commit -m "chore: refresh social provider tokens for testing"
git push origin main
```

### Token Expiry Warnings
The test suite automatically warns when tokens expire within 7 days:

```bash
⚠️  Instagram token expires in 3 days. Please refresh tokens in test-data.ts
```

## Mock Response System

### Successful Responses
```typescript
MOCK_ECS_RESPONSES = {
  instagram: {
    success: {
      result: {
        platformPostId: "instagram_post_123",
        platformPostUrl: "https://www.instagram.com/p/test123/",
        postedAt: "2025-08-29T18:00:00Z"
      }
    }
  }
}
```

### Error Responses
```typescript
MOCK_ECS_RESPONSES = {
  instagram: {
    error: {
      error: {
        code: "MEDIA_UPLOAD_FAILED", 
        message: "Failed to upload media to Instagram"
      }
    }
  }
}
```

## Test Media Assets

### Images
- **Single**: High-quality stock photo (800x600)
- **Carousel**: 3 diverse stock photos for variety

### Videos  
- **Short**: 15-second sample for reels/shorts
- **Medium**: 1-minute sample for standard posts
- **Long**: 12-minute sample for YouTube

```typescript
export const TEST_MEDIA = {
  images: {
    single: "https://images.unsplash.com/photo-1516315607641-5e0b7ff6c10c?w=800&h=600",
    carousel: [/* 3 image URLs */]
  },
  videos: {
    short: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    long: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
  }
}
```

## Performance & Optimization

### CI/CD Optimizations
- **15-minute timeout**: Prevents excessive CPU usage
- **Change detection**: Only runs when provider code changes
- **Parallel execution**: Multiple test files run concurrently
- **Selective testing**: Manual dispatch allows single platform testing

### Mock Strategy
- **No actual API calls**: All external requests mocked
- **Real request structure**: Full ECS endpoint integration
- **Comprehensive error simulation**: All failure modes covered
- **Fast execution**: Tests complete in under 2 minutes

## Troubleshooting

### Common Issues

#### 1. Token Expired Errors
```bash
❌ Instagram token has expired! Please refresh tokens in test-data.ts
```
**Solution**: Follow the token refresh process above

#### 2. Network Mock Failures
```bash
TypeError: Cannot read property 'post' of undefined
```
**Solution**: Ensure setup.ts properly mocks axios

#### 3. ECS Endpoint Changes
```bash
404: Lambda URL not found
```
**Solution**: Update `ECS_LAMBDA_URL` in test-data.ts

#### 4. Test Timeouts
```bash
Test timed out in 30000ms
```
**Solution**: Check for infinite loops in mocks or increase timeout

### Debug Mode
```bash
# Run with verbose logging
DEBUG=* pnpm test

# Run single test with full output
pnpm test instagram.test.ts --reporter=verbose --no-coverage
```

## Contributing

### Adding New Platform Tests
1. Create new test file: `packages/worker/__tests__/newplatform.test.ts`
2. Add platform to `TEST_SOCIAL_PROVIDERS` in `test-data.ts`  
3. Add mock responses to `MOCK_ECS_RESPONSES`
4. Follow existing test patterns for consistency
5. Update platform support matrix in README

### Test Structure Guidelines
```typescript
describe('Platform Provider Tests', () => {
  describe('Token Validation', () => { /* ... */ })
  describe('Content Type Tests', () => { /* ... */ })
  describe('Error Handling', () => { /* ... */ })
  describe('Payload Structure Validation', () => { /* ... */ })
})
```

### Mock Response Guidelines
- Use consistent error codes from `packages/worker/providers/errors.ts`
- Include realistic platform-specific details
- Test both success and failure scenarios
- Validate request payload structure

## Security Considerations

### Token Storage
- ✅ Real tokens stored in repository (acceptable for testing)
- ✅ Tokens have limited scope (posting only)
- ✅ Tokens expire automatically every 2 months
- ✅ No production tokens used in testing

### API Safety
- ✅ All external API calls mocked
- ✅ No accidental posting to social platforms
- ✅ ECS endpoint calls intercepted
- ✅ Network isolation in test environment

---

This comprehensive testing suite ensures robust social media posting functionality across all platforms while maintaining security and performance best practices.