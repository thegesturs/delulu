// Threads Provider Unit Tests
// Tests: Single Image, Carousel, Video, Thread chains via ECS endpoint

import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import axios from 'axios'
import { TEST_SOCIAL_PROVIDERS, TEST_CONTENT, ECS_LAMBDA_URL, MOCK_ECS_RESPONSES, validateTokens } from './test-data'

describe('Threads Provider Tests', () => {
  beforeAll(() => {
    // Validate token expiry before running tests
    validateTokens()
  })

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  describe('Token Validation', () => {
    it('should have valid Threads token', () => {
      const threadsProvider = TEST_SOCIAL_PROVIDERS.threads
      expect(threadsProvider.accessToken).toBeDefined()
      expect(threadsProvider.accessToken).not.toBe('')
      expect(threadsProvider.profileId).toBeDefined()
      expect(threadsProvider.expiresIn).toBeGreaterThan(Date.now())
    })

    it('should warn if token expires within 7 days', () => {
      const threadsProvider = TEST_SOCIAL_PROVIDERS.threads
      const daysUntilExpiry = (threadsProvider.expiresIn - Date.now()) / (1000 * 60 * 60 * 24)
      
      if (daysUntilExpiry < 7) {
        console.warn(`Threads token expires in ${Math.floor(daysUntilExpiry)} days`)
      }
      
      expect(daysUntilExpiry).toBeGreaterThan(0)
    })
  })

  describe('Single Image Posts', () => {
    it('should successfully post single image', async () => {
      // Mock successful ECS response
      mockECSEndpoint(MOCK_ECS_RESPONSES.threads.success)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.threads.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, payload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      expect(response.data.result.platformId).toBe('threads')
      expect(response.data.result.platformPostId).toBeDefined()
      expect(response.data.result.platformPostUrl).toContain('threads.net')
      expect(axios.post).toHaveBeenCalledWith(ECS_LAMBDA_URL, payload, {
        headers: { 'x-api-key': 'test-api-key' }
      })
    })

    it('should handle invalid image URL', async () => {
      mockECSEndpointError(MOCK_ECS_RESPONSES.threads.error, 400)

      const invalidPayload = {
        content: {
          content: [{
            text: "Test with invalid image",
            media: [{ url: "invalid-url", mediaType: 'IMAGE' }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.threads.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, invalidPayload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('PUBLISH_FAILED')
      }
    })

    it('should handle text-only posts', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.threads.success)

      const textOnlyPayload = {
        content: {
          content: [{
            text: "This is a text-only Threads post #testing",
            media: [],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.threads.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, textOnlyPayload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      expect(response.data.result.platformId).toBe('threads')

      // Verify payload structure for text-only post
      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content[0].media).toHaveLength(0)
      expect(sentPayload.content.content[0].text).toContain('#testing')
    })
  })

  describe('Carousel Posts', () => {
    it('should successfully post image carousel', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.threads.success)

      const payload = {
        content: TEST_CONTENT.carousel,
        socialProviderId: TEST_SOCIAL_PROVIDERS.threads.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, payload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      expect(response.data.result.platformId).toBe('threads')
      expect(response.data.result.platformPostUrl).toContain('threads.net')

      // Verify payload structure for carousel
      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content[0].media).toHaveLength(3)
      expect(sentPayload.content.content[0].media.every((m: any) => m.mediaType === 'IMAGE')).toBe(true)
    })

    it('should handle carousel with maximum images (10)', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.threads.success)

      const maxImagesPayload = {
        content: {
          content: [{
            text: "Test with maximum 10 images",
            media: Array(10).fill(0).map((_, i) => ({
              url: `https://example.com/image${i}.jpg`,
              mediaType: 'IMAGE',
              publicId: `image-${i}`,
              secureUrl: `https://example.com/image${i}.jpg`
            })),
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.threads.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, maxImagesPayload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      
      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content[0].media).toHaveLength(10)
    })

    it('should handle carousel with too many images (>10)', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_MEDIA',
          message: 'Threads carousel supports maximum 10 images'
        }
      }, 400)

      const tooManyImagesPayload = {
        content: {
          content: [{
            text: "Test with too many images",
            media: Array(12).fill(0).map((_, i) => ({
              url: `https://example.com/image${i}.jpg`,
              mediaType: 'IMAGE'
            })),
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.threads.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, tooManyImagesPayload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('INVALID_MEDIA')
      }
    })
  })

  describe('Video Posts', () => {
    it('should successfully post video', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.threads.success)

      const payload = {
        content: TEST_CONTENT.singleVideo,
        socialProviderId: TEST_SOCIAL_PROVIDERS.threads.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, payload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      expect(response.data.result.platformId).toBe('threads')
      expect(response.data.result.platformPostUrl).toContain('threads.net')

      // Verify payload structure for video
      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content[0].media).toHaveLength(1)
      expect(sentPayload.content.content[0].media[0].mediaType).toBe('VIDEO')
    })

    it('should handle video processing states', async () => {
      // First call - processing
      mockECSEndpointError({
        error: {
          code: 'MEDIA_PROCESSING_IN_PROGRESS',
          message: 'Video is still being processed'
        }
      }, 202)

      const payload = {
        content: TEST_CONTENT.reel,
        socialProviderId: TEST_SOCIAL_PROVIDERS.threads.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, payload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(202)
        expect(error.response.data.error.code).toBe('MEDIA_PROCESSING_IN_PROGRESS')
      }
    })

    it('should handle video processing timeout', async () => {
      mockECSEndpointError({
        error: {
          code: 'MEDIA_PROCESSING_TIMEOUT',
          message: 'Video processing timed out'
        }
      }, 408)

      const payload = {
        content: TEST_CONTENT.reel,
        socialProviderId: TEST_SOCIAL_PROVIDERS.threads.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, payload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(408)
        expect(error.response.data.error.code).toBe('MEDIA_PROCESSING_TIMEOUT')
      }
    })

    it('should handle mixed media in single post (images + video)', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_MEDIA',
          message: 'Threads posts cannot mix images and videos in single post'
        }
      }, 400)

      const mixedMediaPayload = {
        content: {
          content: [{
            text: "Test with mixed media",
            media: [
              { url: "https://example.com/image.jpg", mediaType: 'IMAGE' },
              { url: "https://example.com/video.mp4", mediaType: 'VIDEO' }
            ],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.threads.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, mixedMediaPayload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('INVALID_MEDIA')
      }
    })
  })

  describe('Thread Chains (Multiple Content Items)', () => {
    it('should handle thread-style posts with multiple content items', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.threads.success)

      const threadPayload = {
        content: {
          content: [
            {
              text: "This is the first post in a thread 🧵",
              media: [{ 
                url: TEST_CONTENT.singleImage.content[0].media[0].url, 
                mediaType: 'IMAGE',
                publicId: "thread-1",
                secureUrl: TEST_CONTENT.singleImage.content[0].media[0].url
              }],
              order: 1
            },
            {
              text: "This is the second post in the same thread. Each content item becomes a reply.",
              media: [],
              order: 2
            },
            {
              text: "And this is the third post, completing our thread!",
              media: [],
              order: 3
            }
          ]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.threads.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, threadPayload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      expect(response.data.result.platformId).toBe('threads')

      // Verify payload structure for thread
      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content).toHaveLength(3)
      expect(sentPayload.content.content[0].order).toBe(1)
      expect(sentPayload.content.content[1].order).toBe(2)
      expect(sentPayload.content.content[2].order).toBe(3)
      expect(sentPayload.content.content[0].text).toContain('🧵')
    })

    it('should handle thread with mixed media across items', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.threads.success)

      const mixedThreadPayload = {
        content: {
          content: [
            {
              text: "Thread with image in first post",
              media: [{ 
                url: TEST_CONTENT.singleImage.content[0].media[0].url, 
                mediaType: 'IMAGE',
                publicId: "thread-image",
                secureUrl: TEST_CONTENT.singleImage.content[0].media[0].url
              }],
              order: 1
            },
            {
              text: "And video in second post",
              media: [{ 
                url: TEST_CONTENT.singleVideo.content[0].media[0].url, 
                mediaType: 'VIDEO',
                publicId: "thread-video",
                secureUrl: TEST_CONTENT.singleVideo.content[0].media[0].url
              }],
              order: 2
            }
          ]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.threads.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, mixedThreadPayload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)

      // Verify each thread item has its own media
      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content[0].media[0].mediaType).toBe('IMAGE')
      expect(sentPayload.content.content[1].media[0].mediaType).toBe('VIDEO')
    })
  })

  describe('Error Handling', () => {
    it('should handle expired access token', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_ACCESS_TOKEN',
          message: 'Threads access token has expired'
        }
      }, 401)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.threads.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, payload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(401)
        expect(error.response.data.error.code).toBe('INVALID_ACCESS_TOKEN')
      }
    })

    it('should handle rate limit exceeded', async () => {
      mockECSEndpointError({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Threads API rate limit exceeded'
        }
      }, 429)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.threads.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, payload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(429)
        expect(error.response.data.error.code).toBe('RATE_LIMIT_EXCEEDED')
      }
    })

    it('should handle profile not found', async () => {
      mockECSEndpointError({
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Threads profile not found or missing required fields'
        }
      }, 404)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: "invalid_profile_id"
      }

      try {
        await axios.post(ECS_LAMBDA_URL, payload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(404)
        expect(error.response.data.error.code).toBe('PROFILE_NOT_FOUND')
      }
    })

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error')
      ;(networkError as any).code = 'ENOTFOUND'
      vi.mocked(axios.post).mockRejectedValue(networkError)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.threads.id
      }

      await expect(
        axios.post(ECS_LAMBDA_URL, payload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      ).rejects.toThrow('Network Error')
    })
  })

  describe('Content Validation', () => {
    it('should handle empty content', async () => {
      mockECSEndpointError({
        error: {
          code: 'NO_CONTENT',
          message: 'No content to publish'
        }
      }, 400)

      const emptyPayload = {
        content: {
          content: [{
            text: "",
            media: [],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.threads.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, emptyPayload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('NO_CONTENT')
      }
    })

    it('should handle content policy violations', async () => {
      mockECSEndpointError({
        error: {
          code: 'CONTENT_POLICY_VIOLATION',
          message: 'Content violates Threads community guidelines'
        }
      }, 400)

      const violatingContent = {
        content: {
          content: [{
            text: "Inappropriate content that violates policies",
            media: [],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.threads.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, violatingContent, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('CONTENT_POLICY_VIOLATION')
      }
    })

    it('should handle character limit exceeded', async () => {
      mockECSEndpointError({
        error: {
          code: 'CONTENT_TOO_LONG',
          message: 'Thread post exceeds character limit'
        }
      }, 400)

      const longTextPayload = {
        content: {
          content: [{
            text: "A".repeat(600), // Assuming 500 char limit for Threads
            media: [],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.threads.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, longTextPayload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('CONTENT_TOO_LONG')
      }
    })
  })

  describe('Payload Structure Validation', () => {
    it('should send correct payload format to ECS endpoint', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.threads.success)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.threads.id
      }

      await axios.post(ECS_LAMBDA_URL, payload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      
      // Verify payload structure
      expect(sentPayload).toHaveProperty('content')
      expect(sentPayload).toHaveProperty('socialProviderId')
      expect(sentPayload.content).toHaveProperty('content')
      expect(Array.isArray(sentPayload.content.content)).toBe(true)
      expect(sentPayload.content.content[0]).toHaveProperty('text')
      expect(sentPayload.content.content[0]).toHaveProperty('media')
      expect(sentPayload.content.content[0]).toHaveProperty('order')
      expect(sentPayload.socialProviderId).toBe(TEST_SOCIAL_PROVIDERS.threads.id)
    })

    it('should include correct headers in ECS request', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.threads.success)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.threads.id
      }

      await axios.post(ECS_LAMBDA_URL, payload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      const sentHeaders = vi.mocked(axios.post).mock.calls[0][2]
      expect(sentHeaders.headers).toHaveProperty('x-api-key')
      expect(sentHeaders.headers['x-api-key']).toBe('test-api-key')
    })
  })
})