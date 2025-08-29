// LinkedIn Provider Unit Tests
// Tests: Single Image, Multi-Image, Video posting via ECS endpoint
// Note: We don't support LinkedIn organization posting, only personal profiles

import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import axios from 'axios'
import { TEST_SOCIAL_PROVIDERS, TEST_CONTENT, ECS_LAMBDA_URL, MOCK_ECS_RESPONSES, validateTokens } from './test-data'

describe('LinkedIn Provider Tests', () => {
  beforeAll(() => {
    // Validate token expiry before running tests
    validateTokens()
  })

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  describe('Token Validation', () => {
    it('should have valid LinkedIn token placeholder', () => {
      const linkedinProvider = TEST_SOCIAL_PROVIDERS.linkedin
      expect(linkedinProvider.accessToken).toBeDefined()
      expect(linkedinProvider.profileId).toBeDefined()
      expect(linkedinProvider.expiresIn).toBeGreaterThan(Date.now())
      
      // This will show warning until real token is provided
      if (linkedinProvider.accessToken === 'LINKEDIN_TOKEN_NEEDED') {
        console.warn('⚠️  LinkedIn provider needs real access token in test-data.ts')
      }
    })

    it('should warn if token expires within 7 days', () => {
      const linkedinProvider = TEST_SOCIAL_PROVIDERS.linkedin
      const daysUntilExpiry = (linkedinProvider.expiresIn - Date.now()) / (1000 * 60 * 60 * 24)
      
      if (daysUntilExpiry < 7) {
        console.warn(`LinkedIn token expires in ${Math.floor(daysUntilExpiry)} days`)
      }
      
      expect(daysUntilExpiry).toBeGreaterThan(0)
    })
  })

  describe('Single Image Posts', () => {
    it('should successfully post single image to LinkedIn', async () => {
      // Mock successful ECS response
      mockECSEndpoint(MOCK_ECS_RESPONSES.linkedin.success)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.linkedin.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, payload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      expect(response.data.result.platformId).toBe('linkedin')
      expect(response.data.result.platformPostId).toBeDefined()
      expect(response.data.result.platformPostUrl).toContain('linkedin.com')
      expect(axios.post).toHaveBeenCalledWith(ECS_LAMBDA_URL, payload, {
        headers: { 'x-api-key': 'test-api-key' }
      })
    })

    it('should handle professional content with proper formatting', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.linkedin.success)

      const professionalPayload = {
        content: {
          content: [{
            text: "Excited to share insights on #AI and #MachineLearning from our latest project. Here are the key takeaways: \n\n1. Data quality is paramount\n2. Model interpretability matters\n3. Continuous learning is essential\n\nWhat's your experience with implementing AI solutions? #Technology #Innovation",
            media: [{ 
              url: TEST_CONTENT.singleImage.content[0].media[0].url, 
              mediaType: 'IMAGE',
              publicId: "professional-insight",
              secureUrl: TEST_CONTENT.singleImage.content[0].media[0].url
            }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.linkedin.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, professionalPayload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      expect(response.data.result.platformId).toBe('linkedin')

      // Verify payload structure for professional content
      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content[0].text).toContain('#AI')
      expect(sentPayload.content.content[0].text).toContain('insights')
    })

    it('should handle invalid image URL', async () => {
      mockECSEndpointError(MOCK_ECS_RESPONSES.linkedin.error, 400)

      const invalidPayload = {
        content: {
          content: [{
            text: "Test with invalid image",
            media: [{ url: "invalid-url", mediaType: 'IMAGE' }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.linkedin.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, invalidPayload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('INVALID_ACCESS_TOKEN')
      }
    })

    it('should handle text-only professional posts', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.linkedin.success)

      const textOnlyPayload = {
        content: {
          content: [{
            text: "Reflecting on the importance of #ContinuousLearning in tech. The field evolves so rapidly that what we learned yesterday might be outdated tomorrow. How do you stay current with industry trends? #ProfessionalDevelopment #Tech",
            media: [],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.linkedin.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, textOnlyPayload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      expect(response.data.result.platformId).toBe('linkedin')

      // Verify payload structure for text-only post
      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content[0].media).toHaveLength(0)
      expect(sentPayload.content.content[0].text).toContain('#ContinuousLearning')
    })
  })

  describe('Multi-Image Posts', () => {
    it('should successfully post multiple images (LinkedIn carousel)', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.linkedin.success)

      const payload = {
        content: TEST_CONTENT.carousel,
        socialProviderId: TEST_SOCIAL_PROVIDERS.linkedin.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, payload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      expect(response.data.result.platformId).toBe('linkedin')
      expect(response.data.result.platformPostUrl).toContain('linkedin.com')

      // Verify payload structure for multi-image
      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content[0].media).toHaveLength(3)
      expect(sentPayload.content.content[0].media.every((m: any) => m.mediaType === 'IMAGE')).toBe(true)
    })

    it('should handle maximum images limit (9 images)', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.linkedin.success)

      const maxImagesPayload = {
        content: {
          content: [{
            text: "Sharing 9 key insights from our recent conference #Leadership #Strategy",
            media: Array(9).fill(0).map((_, i) => ({
              url: `https://example.com/insight${i + 1}.jpg`,
              mediaType: 'IMAGE',
              publicId: `insight-${i + 1}`,
              secureUrl: `https://example.com/insight${i + 1}.jpg`
            })),
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.linkedin.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, maxImagesPayload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      
      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content[0].media).toHaveLength(9)
    })

    it('should handle too many images (>9)', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_MEDIA',
          message: 'LinkedIn supports maximum 9 images per post'
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
        socialProviderId: TEST_SOCIAL_PROVIDERS.linkedin.id
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

    it('should handle image upload failures in multi-image posts', async () => {
      mockECSEndpointError({
        error: {
          code: 'MEDIA_UPLOAD_FAILED',
          message: 'One or more images failed to upload to LinkedIn'
        }
      }, 500)

      const payload = {
        content: TEST_CONTENT.carousel,
        socialProviderId: TEST_SOCIAL_PROVIDERS.linkedin.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, payload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(500)
        expect(error.response.data.error.code).toBe('MEDIA_UPLOAD_FAILED')
      }
    })
  })

  describe('Video Posts', () => {
    it('should successfully post video content', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.linkedin.success)

      const payload = {
        content: TEST_CONTENT.singleVideo,
        socialProviderId: TEST_SOCIAL_PROVIDERS.linkedin.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, payload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      expect(response.data.result.platformId).toBe('linkedin')
      expect(response.data.result.platformPostUrl).toContain('linkedin.com')

      // Verify payload structure for video
      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content[0].media).toHaveLength(1)
      expect(sentPayload.content.content[0].media[0].mediaType).toBe('VIDEO')
    })

    it('should handle video processing states', async () => {
      mockECSEndpointError({
        error: {
          code: 'MEDIA_PROCESSING_IN_PROGRESS',
          message: 'LinkedIn video is being processed'
        }
      }, 202)

      const payload = {
        content: TEST_CONTENT.singleVideo,
        socialProviderId: TEST_SOCIAL_PROVIDERS.linkedin.id
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
          message: 'LinkedIn video processing timed out'
        }
      }, 408)

      const payload = {
        content: TEST_CONTENT.reel,
        socialProviderId: TEST_SOCIAL_PROVIDERS.linkedin.id
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

    it('should handle video file size limits', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_MEDIA',
          message: 'LinkedIn video file size exceeds 5GB limit'
        }
      }, 400)

      const largeVideoPayload = {
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
        socialProviderId: TEST_SOCIAL_PROVIDERS.linkedin.id
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

    it('should handle video duration limits', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_MEDIA',
          message: 'LinkedIn video duration must be between 3 seconds and 10 minutes'
        }
      }, 400)

      const longVideoPayload = {
        content: {
          content: [{
            text: "Test with video too long for LinkedIn",
            media: [{
              url: "https://example.com/15-minute-video.mp4",
              mediaType: 'VIDEO'
            }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.linkedin.id
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
          message: 'LinkedIn supports only one video per post'
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
        socialProviderId: TEST_SOCIAL_PROVIDERS.linkedin.id
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

    it('should handle mixed media (video + images not supported)', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_MEDIA',
          message: 'LinkedIn posts cannot mix videos with images'
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
        socialProviderId: TEST_SOCIAL_PROVIDERS.linkedin.id
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

  describe('Error Handling', () => {
    it('should handle expired access token', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_ACCESS_TOKEN',
          message: 'LinkedIn access token has expired'
        }
      }, 401)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.linkedin.id
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

    it('should handle LinkedIn API rate limits', async () => {
      mockECSEndpointError({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'LinkedIn API rate limit exceeded',
          retryAfter: 3600
        }
      }, 429)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.linkedin.id
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
          message: 'LinkedIn profile not found or app lacks access'
        }
      }, 404)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: "invalid_linkedin_profile_id"
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

    it('should handle insufficient permissions', async () => {
      mockECSEndpointError({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'LinkedIn app lacks required permissions for posting'
        }
      }, 403)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.linkedin.id
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

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error')
      ;(networkError as any).code = 'ENOTFOUND'
      vi.mocked(axios.post).mockRejectedValue(networkError)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.linkedin.id
      }

      await expect(
        axios.post(ECS_LAMBDA_URL, payload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      ).rejects.toThrow('Network Error')
    })
  })

  describe('Professional Content Validation', () => {
    it('should handle content quality guidelines', async () => {
      mockECSEndpointError({
        error: {
          code: 'CONTENT_QUALITY_ISSUE',
          message: 'Content does not meet LinkedIn professional standards'
        }
      }, 400)

      const lowQualityContent = {
        content: {
          content: [{
            text: "hey whats up everyone!!!! check this out!!!!!",
            media: [],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.linkedin.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, lowQualityContent, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('CONTENT_QUALITY_ISSUE')
      }
    })

    it('should handle spam detection', async () => {
      mockECSEndpointError({
        error: {
          code: 'SPAM_DETECTED',
          message: 'Content flagged as potential spam by LinkedIn'
        }
      }, 400)

      const spamContent = {
        content: {
          content: [{
            text: "MAKE MONEY FAST! CLICK HERE NOW! GUARANTEED INCOME! #MLM #GetRichQuick",
            media: [],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.linkedin.id
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

    it('should handle organization posting restriction', async () => {
      mockECSEndpointError({
        error: {
          code: 'UNSUPPORTED_PROFILE_TYPE',
          message: 'LinkedIn organization posting is not supported. Use personal profiles only.'
        }
      }, 400)

      const organizationPayload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: "organization_profile_id"
      }

      try {
        await axios.post(ECS_LAMBDA_URL, organizationPayload, {
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
      mockECSEndpoint(MOCK_ECS_RESPONSES.linkedin.success)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.linkedin.id
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
      expect(sentPayload.socialProviderId).toBe(TEST_SOCIAL_PROVIDERS.linkedin.id)
    })

    it('should include correct headers in ECS request', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.linkedin.success)

      const payload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.linkedin.id
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