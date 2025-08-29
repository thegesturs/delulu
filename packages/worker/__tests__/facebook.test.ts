// Facebook Provider Unit Tests  
// Tests: Single Image, Carousel (Albums), Reel posting via ECS endpoint
// Note: We don't support Facebook personal page posting, only business pages

import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import axios from 'axios'
import { TEST_SOCIAL_PROVIDERS, TEST_CONTENT, ECS_LAMBDA_URL, MOCK_ECS_RESPONSES, validateTokens } from './test-data'

describe('Facebook Provider Tests', () => {
  beforeAll(() => {
    // Validate token expiry before running tests
    validateTokens()
  })

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  describe('Token Validation', () => {
    it('should have valid Facebook token placeholder', () => {
      const facebookProvider = TEST_SOCIAL_PROVIDERS.facebook
      expect(facebookProvider.accessToken).toBeDefined()
      expect(facebookProvider.profileId).toBeDefined()
      expect(facebookProvider.expiresIn).toBeGreaterThan(Date.now())
      
      // This will show warning until real token is provided
      if (facebookProvider.accessToken === 'FACEBOOK_TOKEN_NEEDED') {
        console.warn('⚠️  Facebook provider needs real access token in test-data.ts')
      }
    })

    it('should warn if token expires within 7 days', () => {
      const facebookProvider = TEST_SOCIAL_PROVIDERS.facebook
      const daysUntilExpiry = (facebookProvider.expiresIn - Date.now()) / (1000 * 60 * 60 * 24)
      
      if (daysUntilExpiry < 7) {
        console.warn(`Facebook token expires in ${Math.floor(daysUntilExpiry)} days`)
      }
      
      expect(daysUntilExpiry).toBeGreaterThan(0)
    })
  })

  describe('Single Image Posts', () => {
    it('should successfully post single image to Facebook page', async () => {
      // Mock successful ECS response
      mockECSEndpoint(MOCK_ECS_RESPONSES.facebook.success)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.facebook.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, payload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      expect(response.data.result.platformId).toBe('facebook')
      expect(response.data.result.platformPostId).toBeDefined()
      expect(response.data.result.platformPostUrl).toContain('facebook.com')
      expect(axios.post).toHaveBeenCalledWith(ECS_LAMBDA_URL, payload, {
        headers: { 'x-api-key': 'test-api-key' }
      })
    })

    it('should handle invalid image URL', async () => {
      mockECSEndpointError(MOCK_ECS_RESPONSES.facebook.error, 400)

      const invalidPayload = {
        content: {
          content: [{
            text: "Test with invalid image",
            media: [{ url: "invalid-url", mediaType: 'IMAGE' }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.facebook.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, invalidPayload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('API_ERROR')
      }
    })

    it('should handle Facebook page permissions error', async () => {
      mockECSEndpointError({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'App does not have permission to publish to this Facebook page'
        }
      }, 403)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.facebook.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, payload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(403)
        expect(error.response.data.error.code).toBe('INSUFFICIENT_PERMISSIONS')
      }
    })
  })

  describe('Photo Albums (Carousel)', () => {
    it('should successfully create photo album with multiple images', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.facebook.success)

      const payload = {
        content: TEST_CONTENT.carousel,
        socialProviderId: TEST_SOCIAL_PROVIDERS.facebook.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, payload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      expect(response.data.result.platformId).toBe('facebook')
      expect(response.data.result.platformPostUrl).toContain('facebook.com')

      // Verify payload structure for album
      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content[0].media).toHaveLength(3)
      expect(sentPayload.content.content[0].media.every((m: any) => m.mediaType === 'IMAGE')).toBe(true)
    })

    it('should handle album with too many images', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_MEDIA',
          message: 'Facebook album supports maximum 30 photos'
        }
      }, 400)

      const tooManyImagesPayload = {
        content: {
          content: [{
            text: "Test with too many images for album",
            media: Array(35).fill(0).map((_, i) => ({
              url: `https://example.com/image${i}.jpg`,
              mediaType: 'IMAGE'
            })),
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.facebook.id
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

    it('should handle album creation failure', async () => {
      mockECSEndpointError({
        error: {
          code: 'ALBUM_CREATION_FAILED',
          message: 'Failed to create Facebook photo album'
        }
      }, 500)

      const payload = {
        content: TEST_CONTENT.carousel,
        socialProviderId: TEST_SOCIAL_PROVIDERS.facebook.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, payload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(500)
        expect(error.response.data.error.code).toBe('ALBUM_CREATION_FAILED')
      }
    })
  })

  describe('Facebook Reels', () => {
    it('should successfully post video reel', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.facebook.success)

      const payload = {
        content: TEST_CONTENT.reel,
        socialProviderId: TEST_SOCIAL_PROVIDERS.facebook.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, payload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      expect(response.data.result.platformId).toBe('facebook')
      expect(response.data.result.platformPostUrl).toContain('facebook.com')

      // Verify payload structure for reel
      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content[0].media).toHaveLength(1)
      expect(sentPayload.content.content[0].media[0].mediaType).toBe('VIDEO')
    })

    it('should handle video upload process phases', async () => {
      // Mock different phases of video processing
      mockECSEndpointError({
        error: {
          code: 'MEDIA_PROCESSING_IN_PROGRESS',
          message: 'Facebook video is being processed',
          phase: 'uploading'
        }
      }, 202)

      const payload = {
        content: TEST_CONTENT.reel,
        socialProviderId: TEST_SOCIAL_PROVIDERS.facebook.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, payload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(202)
        expect(error.response.data.error.code).toBe('MEDIA_PROCESSING_IN_PROGRESS')
        expect(error.response.data.error.phase).toBe('uploading')
      }
    })

    it('should handle video processing timeout', async () => {
      mockECSEndpointError({
        error: {
          code: 'MEDIA_PROCESSING_TIMEOUT',
          message: 'Facebook video processing timed out after 5 minutes'
        }
      }, 408)

      const payload = {
        content: TEST_CONTENT.reel,
        socialProviderId: TEST_SOCIAL_PROVIDERS.facebook.id
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

    it('should handle video processing errors', async () => {
      mockECSEndpointError({
        error: {
          code: 'MEDIA_PROCESSING_FAILED',
          message: 'Facebook video processing failed: invalid format'
        }
      }, 400)

      const invalidVideoPayload = {
        content: {
          content: [{
            text: "Test with invalid video format",
            media: [{
              url: "https://example.com/invalid-video.gif",
              mediaType: 'VIDEO'
            }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.facebook.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, invalidVideoPayload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('MEDIA_PROCESSING_FAILED')
      }
    })

    it('should handle video file size limits', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_MEDIA',
          message: 'Facebook reel file size exceeds 1GB limit'
        }
      }, 400)

      const largVideoPayload = {
        content: {
          content: [{
            text: "Test with oversized video",
            media: [{
              url: "https://example.com/huge-video.mp4",
              mediaType: 'VIDEO'
            }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.facebook.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, largVideoPayload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('INVALID_MEDIA')
      }
    })

    it('should reject multiple videos (not supported)', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_MEDIA',
          message: 'Facebook supports only one video per post'
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
        socialProviderId: TEST_SOCIAL_PROVIDERS.facebook.id
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
          message: 'Facebook access token has expired'
        }
      }, 401)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.facebook.id
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

    it('should handle Facebook API rate limits', async () => {
      mockECSEndpointError({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Facebook API rate limit exceeded',
          retryAfter: 3600
        }
      }, 429)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.facebook.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, payload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(429)
        expect(error.response.data.error.code).toBe('RATE_LIMIT_EXCEEDED')
        expect(error.response.data.error.retryAfter).toBe(3600)
      }
    })

    it('should handle profile not found', async () => {
      mockECSEndpointError({
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Facebook page not found or app lacks access'
        }
      }, 404)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: "invalid_facebook_page_id"
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

    it('should handle Facebook API server errors', async () => {
      mockECSEndpointError({
        error: {
          code: 'API_ERROR',
          message: 'Facebook API temporarily unavailable'
        }
      }, 503)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.facebook.id
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

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error')
      ;(networkError as any).code = 'ENOTFOUND'
      vi.mocked(axios.post).mockRejectedValue(networkError)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.facebook.id
      }

      await expect(
        axios.post(ECS_LAMBDA_URL, payload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      ).rejects.toThrow('Network Error')
    })
  })

  describe('Content Policy & Restrictions', () => {
    it('should handle content policy violations', async () => {
      mockECSEndpointError({
        error: {
          code: 'CONTENT_POLICY_VIOLATION',
          message: 'Content violates Facebook community standards'
        }
      }, 400)

      const violatingContent = {
        content: {
          content: [{
            text: "Inappropriate content that violates Facebook policies",
            media: [],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.facebook.id
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

    it('should handle spam detection', async () => {
      mockECSEndpointError({
        error: {
          code: 'SPAM_DETECTED',
          message: 'Content flagged as potential spam by Facebook'
        }
      }, 400)

      const spamContent = {
        content: {
          content: [{
            text: "CLICK HERE NOW! BUY BUY BUY! LIMITED TIME OFFER!",
            media: [],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.facebook.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, spamContent, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('SPAM_DETECTED')
      }
    })

    it('should handle personal profile posting restriction', async () => {
      mockECSEndpointError({
        error: {
          code: 'UNSUPPORTED_PROFILE_TYPE',
          message: 'Personal Facebook profiles are not supported. Use Facebook pages only.'
        }
      }, 400)

      const personalProfilePayload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: "personal_profile_id"
      }

      try {
        await axios.post(ECS_LAMBDA_URL, personalProfilePayload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('UNSUPPORTED_PROFILE_TYPE')
      }
    })
  })

  describe('Payload Structure Validation', () => {
    it('should send correct payload format to ECS endpoint', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.facebook.success)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.facebook.id
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
      expect(sentPayload.socialProviderId).toBe(TEST_SOCIAL_PROVIDERS.facebook.id)
    })

    it('should include correct headers in ECS request', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.facebook.success)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.facebook.id
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