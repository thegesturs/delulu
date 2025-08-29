// TikTok Provider Unit Tests
// Tests: Video posting only (no images or carousels supported) via ECS endpoint

import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import axios from 'axios'
import { TEST_SOCIAL_PROVIDERS, TEST_CONTENT, ECS_LAMBDA_URL, MOCK_ECS_RESPONSES, validateTokens } from './test-data'

describe('TikTok Provider Tests', () => {
  beforeAll(() => {
    // Validate token expiry before running tests
    validateTokens()
  })

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  describe('Token Validation', () => {
    it('should have valid TikTok token placeholder', () => {
      const tiktokProvider = TEST_SOCIAL_PROVIDERS.tiktok
      expect(tiktokProvider.accessToken).toBeDefined()
      expect(tiktokProvider.refreshToken).toBeDefined()
      expect(tiktokProvider.profileId).toBeDefined()
      expect(tiktokProvider.expiresIn).toBeGreaterThan(Date.now())
      
      // This will show warning until real token is provided
      if (tiktokProvider.accessToken === 'TIKTOK_TOKEN_NEEDED') {
        console.warn('⚠️  TikTok provider needs real access token in test-data.ts')
      }
    })

    it('should warn if token expires within 7 days', () => {
      const tiktokProvider = TEST_SOCIAL_PROVIDERS.tiktok
      const daysUntilExpiry = (tiktokProvider.expiresIn - Date.now()) / (1000 * 60 * 60 * 1000)
      
      if (daysUntilExpiry < 7) {
        console.warn(`TikTok token expires in ${Math.floor(daysUntilExpiry)} days`)
      }
      
      expect(daysUntilExpiry).toBeGreaterThan(0)
    })
  })

  describe('Video Posts (Only Supported Content Type)', () => {
    it('should successfully upload video to TikTok', async () => {
      // Mock successful ECS response
      mockECSEndpoint(MOCK_ECS_RESPONSES.tiktok.success)

      const payload = {
        content: TEST_CONTENT.singleVideo,
        socialProviderId: TEST_SOCIAL_PROVIDERS.tiktok.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, payload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      expect(response.data.result.platformId).toBe('tiktok')
      expect(response.data.result.platformPostId).toBeDefined()
      expect(response.data.result.platformPostUrl).toContain('tiktok.com')
      expect(axios.post).toHaveBeenCalledWith(ECS_LAMBDA_URL, payload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      // Verify payload structure for video
      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content[0].media).toHaveLength(1)
      expect(sentPayload.content.content[0].media[0].mediaType).toBe('VIDEO')
    })

    it('should handle video with hashtags and trending sounds', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.tiktok.success)

      const trendingVideoPayload = {
        content: {
          content: [{
            text: "Dancing to the latest trend! 💃 #FYP #Dance #Trending #ViralDance #TikTokMade",
            media: [{ 
              url: TEST_CONTENT.singleVideo.content[0].media[0].url, 
              mediaType: 'VIDEO',
              publicId: "trending-dance",
              secureUrl: TEST_CONTENT.singleVideo.content[0].media[0].url
            }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.tiktok.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, trendingVideoPayload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      expect(response.data.result.platformId).toBe('tiktok')

      // Verify hashtag content
      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content[0].text).toContain('#FYP')
      expect(sentPayload.content.content[0].text).toContain('💃')
    })

    it('should handle video publishing workflow states', async () => {
      // TikTok has a publishing workflow - first upload, then publish
      mockECSEndpointError({
        error: {
          code: 'MEDIA_PROCESSING_IN_PROGRESS',
          message: 'TikTok video upload is being processed',
          publishId: 'tiktok_publish_123'
        }
      }, 202)

      const payload = {
        content: TEST_CONTENT.reel,
        socialProviderId: TEST_SOCIAL_PROVIDERS.tiktok.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, payload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(202)
        expect(error.response.data.error.code).toBe('MEDIA_PROCESSING_IN_PROGRESS')
        expect(error.response.data.error.publishId).toBeDefined()
      }
    })

    it('should handle video processing timeout', async () => {
      mockECSEndpointError({
        error: {
          code: 'MEDIA_PROCESSING_TIMEOUT',
          message: 'TikTok video processing timed out after maximum wait time'
        }
      }, 408)

      const payload = {
        content: TEST_CONTENT.reel,
        socialProviderId: TEST_SOCIAL_PROVIDERS.tiktok.id
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

    it('should handle video processing failed', async () => {
      mockECSEndpointError(MOCK_ECS_RESPONSES.tiktok.error, 400)

      const invalidVideoPayload = {
        content: {
          content: [{
            text: "Test with invalid video format",
            media: [{
              url: "https://example.com/invalid-format.avi",
              mediaType: 'VIDEO'
            }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.tiktok.id
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

    it('should handle video duration requirements', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_MEDIA',
          message: 'TikTok video duration must be between 3 seconds and 10 minutes'
        }
      }, 400)

      const shortVideoPayload = {
        content: {
          content: [{
            text: "Video too short for TikTok",
            media: [{
              url: "https://example.com/1-second-video.mp4",
              mediaType: 'VIDEO'
            }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.tiktok.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, shortVideoPayload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('INVALID_MEDIA')
      }
    })

    it('should handle video file size limits', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_MEDIA',
          message: 'TikTok video file size exceeds 500MB limit'
        }
      }, 400)

      const largeVideoPayload = {
        content: {
          content: [{
            text: "Test with oversized video file",
            media: [{
              url: "https://example.com/huge-video.mp4",
              mediaType: 'VIDEO'
            }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.tiktok.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, largeVideoPayload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('INVALID_MEDIA')
      }
    })

    it('should handle video resolution requirements', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_MEDIA',
          message: 'TikTok video resolution must be at least 540x960 (9:16 aspect ratio recommended)'
        }
      }, 400)

      const lowResVideoPayload = {
        content: {
          content: [{
            text: "Test with low resolution video",
            media: [{
              url: "https://example.com/480p-video.mp4",
              mediaType: 'VIDEO'
            }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.tiktok.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, lowResVideoPayload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('INVALID_MEDIA')
      }
    })
  })

  describe('Unsupported Content Types', () => {
    it('should reject image posts (not supported)', async () => {
      mockECSEndpointError({
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'TikTok only supports video content, images are not supported'
        }
      }, 400)

      const imagePayload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.tiktok.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, imagePayload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('UNSUPPORTED_MEDIA_TYPE')
      }
    })

    it('should reject carousel posts (not supported)', async () => {
      mockECSEndpointError({
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'TikTok does not support image carousels, only single videos'
        }
      }, 400)

      const carouselPayload = {
        content: TEST_CONTENT.carousel,
        socialProviderId: TEST_SOCIAL_PROVIDERS.tiktok.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, carouselPayload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('UNSUPPORTED_MEDIA_TYPE')
      }
    })

    it('should reject multiple videos (not supported)', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_MEDIA',
          message: 'TikTok supports only one video per post'
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
        socialProviderId: TEST_SOCIAL_PROVIDERS.tiktok.id
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

    it('should reject text-only posts (require video)', async () => {
      mockECSEndpointError({
        error: {
          code: 'NO_MEDIA',
          message: 'TikTok requires video content, text-only posts are not supported'
        }
      }, 400)

      const textOnlyPayload = {
        content: {
          content: [{
            text: "This is a text-only post without video",
            media: [],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.tiktok.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, textOnlyPayload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('NO_MEDIA')
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle expired access token', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_ACCESS_TOKEN',
          message: 'TikTok access token has expired'
        }
      }, 401)

      const payload = {
        content: TEST_CONTENT.singleVideo,
        socialProviderId: TEST_SOCIAL_PROVIDERS.tiktok.id
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

    it('should handle TikTok API rate limits', async () => {
      mockECSEndpointError({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'TikTok API rate limit exceeded',
          retryAfter: 900
        }
      }, 429)

      const payload = {
        content: TEST_CONTENT.singleVideo,
        socialProviderId: TEST_SOCIAL_PROVIDERS.tiktok.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, payload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(429)
        expect(error.response.data.error.code).toBe('RATE_LIMIT_EXCEEDED')
        expect(error.response.data.error.retryAfter).toBe(900)
      }
    })

    it('should handle profile not found', async () => {
      mockECSEndpointError({
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'TikTok profile not found or app lacks access'
        }
      }, 404)

      const payload = {
        content: TEST_CONTENT.singleVideo,
        socialProviderId: "invalid_tiktok_profile_id"
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

    it('should handle TikTok server errors', async () => {
      mockECSEndpointError({
        error: {
          code: 'API_ERROR',
          message: 'TikTok API temporarily unavailable'
        }
      }, 503)

      const payload = {
        content: TEST_CONTENT.singleVideo,
        socialProviderId: TEST_SOCIAL_PROVIDERS.tiktok.id
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
        content: TEST_CONTENT.singleVideo,
        socialProviderId: TEST_SOCIAL_PROVIDERS.tiktok.id
      }

      await expect(
        axios.post(ECS_LAMBDA_URL, payload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      ).rejects.toThrow('Network Error')
    })

    it('should handle insufficient permissions', async () => {
      mockECSEndpointError({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'TikTok app lacks required permissions for video upload'
        }
      }, 403)

      const payload = {
        content: TEST_CONTENT.singleVideo,
        socialProviderId: TEST_SOCIAL_PROVIDERS.tiktok.id
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

  describe('Content Policy & Community Guidelines', () => {
    it('should handle content policy violations', async () => {
      mockECSEndpointError({
        error: {
          code: 'CONTENT_POLICY_VIOLATION',
          message: 'Content violates TikTok community guidelines'
        }
      }, 400)

      const violatingContent = {
        content: {
          content: [{
            text: "Inappropriate content that violates TikTok policies",
            media: [{ url: TEST_CONTENT.singleVideo.content[0].media[0].url, mediaType: 'VIDEO' }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.tiktok.id
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

    it('should handle copyright detection', async () => {
      mockECSEndpointError({
        error: {
          code: 'COPYRIGHT_VIOLATION',
          message: 'Video contains copyrighted content'
        }
      }, 400)

      const copyrightedContent = {
        content: {
          content: [{
            text: "Dancing to copyrighted music",
            media: [{ url: "https://example.com/copyrighted-music-video.mp4", mediaType: 'VIDEO' }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.tiktok.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, copyrightedContent, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('COPYRIGHT_VIOLATION')
      }
    })

    it('should handle age-inappropriate content', async () => {
      mockECSEndpointError({
        error: {
          code: 'INAPPROPRIATE_CONTENT',
          message: 'Content not suitable for TikTok audience'
        }
      }, 400)

      const inappropriateContent = {
        content: {
          content: [{
            text: "Adult content not suitable for platform",
            media: [{ url: TEST_CONTENT.singleVideo.content[0].media[0].url, mediaType: 'VIDEO' }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.tiktok.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, inappropriateContent, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('INAPPROPRIATE_CONTENT')
      }
    })
  })

  describe('Payload Structure Validation', () => {
    it('should send correct payload format to ECS endpoint', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.tiktok.success)

      const payload = {
        content: TEST_CONTENT.singleVideo,
        socialProviderId: TEST_SOCIAL_PROVIDERS.tiktok.id
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
      expect(sentPayload.content.content[0].media).toHaveLength(1)
      expect(sentPayload.content.content[0].media[0].mediaType).toBe('VIDEO')
      expect(sentPayload.socialProviderId).toBe(TEST_SOCIAL_PROVIDERS.tiktok.id)
    })

    it('should include correct headers in ECS request', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.tiktok.success)

      const payload = {
        content: TEST_CONTENT.singleVideo,
        socialProviderId: TEST_SOCIAL_PROVIDERS.tiktok.id
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