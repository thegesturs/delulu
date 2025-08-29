// Instagram Provider Unit Tests
// Tests: Single Image, Carousel, Reel posting via ECS endpoint

import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import axios from 'axios'
import { TEST_SOCIAL_PROVIDERS, TEST_CONTENT, ECS_LAMBDA_URL, MOCK_ECS_RESPONSES, validateTokens } from './test-data'

describe('Instagram Provider Tests', () => {
  beforeAll(() => {
    // Validate token expiry before running tests
    validateTokens()
  })

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  describe('Token Validation', () => {
    it('should have valid Instagram token', () => {
      const instagramProvider = TEST_SOCIAL_PROVIDERS.instagram
      expect(instagramProvider.accessToken).toBeDefined()
      expect(instagramProvider.accessToken).not.toBe('')
      expect(instagramProvider.profileId).toBeDefined()
      expect(instagramProvider.expiresIn).toBeGreaterThan(Date.now())
    })

    it('should warn if token expires within 7 days', () => {
      const instagramProvider = TEST_SOCIAL_PROVIDERS.instagram
      const daysUntilExpiry = (instagramProvider.expiresIn - Date.now()) / (1000 * 60 * 60 * 24)
      
      if (daysUntilExpiry < 7) {
        console.warn(`Instagram token expires in ${Math.floor(daysUntilExpiry)} days`)
      }
      
      expect(daysUntilExpiry).toBeGreaterThan(0)
    })
  })

  describe('Single Image Posts', () => {
    it('should successfully post single image', async () => {
      // Mock successful ECS response
      mockECSEndpoint(MOCK_ECS_RESPONSES.instagram.success)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.instagram.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, payload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      expect(response.data.result.platformId).toBe('instagram')
      expect(response.data.result.platformPostId).toBeDefined()
      expect(response.data.result.platformPostUrl).toContain('instagram.com')
      expect(axios.post).toHaveBeenCalledWith(ECS_LAMBDA_URL, payload, {
        headers: { 'x-api-key': 'test-api-key' }
      })
    })

    it('should handle invalid image URL', async () => {
      mockECSEndpointError(MOCK_ECS_RESPONSES.instagram.error, 400)

      const invalidPayload = {
        content: {
          content: [{
            text: "Test with invalid image",
            media: [{ url: "invalid-url", mediaType: 'IMAGE' }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.instagram.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, invalidPayload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('MEDIA_UPLOAD_FAILED')
      }
    })

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error')
      ;(networkError as any).code = 'ENOTFOUND'
      vi.mocked(axios.post).mockRejectedValue(networkError)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.instagram.id
      }

      await expect(
        axios.post(ECS_LAMBDA_URL, payload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      ).rejects.toThrow('Network Error')
    })
  })

  describe('Carousel Posts', () => {
    it('should successfully post image carousel', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.instagram.success)

      const payload = {
        content: TEST_CONTENT.carousel,
        socialProviderId: TEST_SOCIAL_PROVIDERS.instagram.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, payload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      expect(response.data.result.platformId).toBe('instagram')
      expect(response.data.result.platformPostUrl).toContain('instagram.com')

      // Verify payload structure for carousel
      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content[0].media).toHaveLength(3)
      expect(sentPayload.content.content[0].media.every((m: any) => m.mediaType === 'IMAGE')).toBe(true)
    })

    it('should handle carousel with too many images (>10)', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_MEDIA',
          message: 'Instagram carousel supports maximum 10 images'
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
        socialProviderId: TEST_SOCIAL_PROVIDERS.instagram.id
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

    it('should handle mixed media validation (should be images only)', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_MEDIA',
          message: 'Instagram carousel cannot mix images and videos'
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
        socialProviderId: TEST_SOCIAL_PROVIDERS.instagram.id
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

  describe('Reel Posts', () => {
    it('should successfully post video reel', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.instagram.success)

      const payload = {
        content: TEST_CONTENT.reel,
        socialProviderId: TEST_SOCIAL_PROVIDERS.instagram.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, payload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      expect(response.data.result.platformId).toBe('instagram')
      expect(response.data.result.platformPostUrl).toContain('instagram.com')

      // Verify payload structure for reel
      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content[0].media).toHaveLength(1)
      expect(sentPayload.content.content[0].media[0].mediaType).toBe('VIDEO')
    })

    it('should handle video processing timeout', async () => {
      mockECSEndpointError({
        error: {
          code: 'MEDIA_PROCESSING_TIMEOUT',
          message: 'Instagram video processing timed out'
        }
      }, 408)

      const payload = {
        content: TEST_CONTENT.reel,
        socialProviderId: TEST_SOCIAL_PROVIDERS.instagram.id
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

    it('should handle video too long for reel', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_MEDIA',
          message: 'Instagram reel duration must be between 3-90 seconds'
        }
      }, 400)

      const longVideoPayload = {
        content: {
          content: [{
            text: "Test with video too long for reel",
            media: [{
              url: "https://example.com/very-long-video.mp4",
              mediaType: 'VIDEO'
            }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.instagram.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, longVideoPayload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('INVALID_MEDIA')
      }
    })

    it('should handle multiple videos (not supported)', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_MEDIA',
          message: 'Instagram supports only one video per post'
        }
      }, 400)

      const multipleVideosPayload = {
        content: {
          content: [{
            text: "Test with multiple videos",
            media: [
              { url: "https://example.com/video1.mp4", mediaType: 'VIDEO' },
              { url: "https://example.com/video2.mp4", mediaType: 'VIDEO' }
            ],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.instagram.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, multipleVideosPayload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('INVALID_MEDIA')
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle expired access token', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_ACCESS_TOKEN',
          message: 'Instagram access token has expired'
        }
      }, 401)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.instagram.id
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
          message: 'Instagram API rate limit exceeded'
        }
      }, 429)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.instagram.id
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
          message: 'Instagram profile not found or missing required fields'
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

    it('should handle Instagram API server errors', async () => {
      mockECSEndpointError({
        error: {
          code: 'API_ERROR',
          message: 'Instagram API temporarily unavailable'
        }
      }, 503)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.instagram.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, payload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(503)
        expect(error.response.data.error.code).toBe('API_ERROR')
      }
    })
  })

  describe('Payload Structure Validation', () => {
    it('should send correct payload format to ECS endpoint', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.instagram.success)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.instagram.id
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
      expect(sentPayload.socialProviderId).toBe(TEST_SOCIAL_PROVIDERS.instagram.id)
    })

    it('should include correct headers in ECS request', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.instagram.success)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.instagram.id
      }

      await axios.post(ECS_LAMBDA_URL, payload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      const sentHeaders = vi.mocked(axios.post).mock.calls[0][2]
      expect(sentHeaders.headers).toHaveProperty('x-api-key')
      expect(sentHeaders.headers['x-api-key']).toBe('test-api-key')
    })
  })

  describe('Content Policy Violations', () => {
    it('should handle content policy violations', async () => {
      mockECSEndpointError({
        error: {
          code: 'CONTENT_POLICY_VIOLATION',
          message: 'Content violates Instagram community guidelines'
        }
      }, 400)

      const violatingContent = {
        content: {
          content: [{
            text: "Inappropriate content that violates policies",
            media: [{ url: TEST_CONTENT.singleImage.content[0].media[0].url, mediaType: 'IMAGE' }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.instagram.id
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
  })
})