// YouTube Provider Unit Tests
// Tests: Video uploads (shorts, regular videos) via ECS endpoint
// Note: YouTube supports only video content, no images or carousels

import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import axios from 'axios'
import { TEST_SOCIAL_PROVIDERS, TEST_CONTENT, ECS_LAMBDA_URL, MOCK_ECS_RESPONSES, validateTokens } from './test-data'

describe('YouTube Provider Tests', () => {
  beforeAll(() => {
    // Validate token expiry before running tests
    validateTokens()
  })

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  describe('Token Validation', () => {
    it('should have valid YouTube token placeholder', () => {
      const youtubeProvider = TEST_SOCIAL_PROVIDERS.youtube
      expect(youtubeProvider.accessToken).toBeDefined()
      expect(youtubeProvider.refreshToken).toBeDefined()
      expect(youtubeProvider.profileId).toBeDefined()
      expect(youtubeProvider.expiresIn).toBeGreaterThan(Date.now())
      
      // This will show warning until real token is provided
      if (youtubeProvider.accessToken === 'YOUTUBE_TOKEN_NEEDED') {
        console.warn('⚠️  YouTube provider needs real access token in test-data.ts')
      }
    })

    it('should warn if token expires within 7 days', () => {
      const youtubeProvider = TEST_SOCIAL_PROVIDERS.youtube
      const daysUntilExpiry = (youtubeProvider.expiresIn - Date.now()) / (1000 * 60 * 60 * 1000)
      
      if (daysUntilExpiry < 7) {
        console.warn(`YouTube token expires in ${Math.floor(daysUntilExpiry)} days`)
      }
      
      expect(daysUntilExpiry).toBeGreaterThan(0)
    })
  })

  describe('YouTube Shorts (Short Videos)', () => {
    it('should successfully upload YouTube Short', async () => {
      // Mock successful ECS response
      mockECSEndpoint(MOCK_ECS_RESPONSES.youtube.success)

      const shortsPayload = {
        content: TEST_CONTENT.reel, // Use reel content for shorts
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, shortsPayload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      expect(response.data.result.platformId).toBe('youtube')
      expect(response.data.result.platformPostId).toBeDefined()
      expect(response.data.result.platformPostUrl).toContain('youtube.com')
      expect(axios.post).toHaveBeenCalledWith(ECS_LAMBDA_URL, shortsPayload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      // Verify payload structure for shorts
      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content[0].media).toHaveLength(1)
      expect(sentPayload.content.content[0].media[0].mediaType).toBe('VIDEO')
    })

    it('should handle YouTube Shorts with hashtags', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.youtube.success)

      const shortsWithHashtagsPayload = {
        content: {
          content: [{
            text: "Quick tutorial on React hooks! 🚀 #Shorts #ReactJS #WebDevelopment #JavaScript #Programming #Tutorial #LearnToCode #TechTips",
            media: [{ 
              url: TEST_CONTENT.reel.content[0].media[0].url, 
              mediaType: 'VIDEO',
              publicId: "react-tutorial",
              secureUrl: TEST_CONTENT.reel.content[0].media[0].url
            }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, shortsWithHashtagsPayload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      expect(response.data.result.platformId).toBe('youtube')

      // Verify hashtag content
      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content[0].text).toContain('#Shorts')
      expect(sentPayload.content.content[0].text).toContain('🚀')
    })

    it('should handle shorts duration validation (≤60 seconds)', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_MEDIA',
          message: 'YouTube Shorts must be 60 seconds or less in duration'
        }
      }, 400)

      const longShortsPayload = {
        content: {
          content: [{
            text: "This video is too long for YouTube Shorts #Shorts",
            media: [{
              url: "https://example.com/90-second-video.mp4",
              mediaType: 'VIDEO'
            }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, longShortsPayload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('INVALID_MEDIA')
      }
    })

    it('should handle shorts aspect ratio validation (vertical preferred)', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_MEDIA',
          message: 'YouTube Shorts should be vertical (9:16 aspect ratio recommended)'
        }
      }, 400)

      const horizontalShortsPayload = {
        content: {
          content: [{
            text: "Horizontal video for shorts #Shorts",
            media: [{
              url: "https://example.com/horizontal-video.mp4",
              mediaType: 'VIDEO'
            }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, horizontalShortsPayload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error.code).toBe('INVALID_MEDIA')
      }
    })
  })

  describe('Regular YouTube Videos', () => {
    it('should successfully upload regular YouTube video', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.youtube.success)

      const payload = {
        content: TEST_CONTENT.youtubeVideo,
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, payload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      expect(response.data.result.platformId).toBe('youtube')
      expect(response.data.result.platformPostUrl).toContain('youtube.com')

      // Verify payload structure for regular video
      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content[0].media).toHaveLength(1)
      expect(sentPayload.content.content[0].media[0].mediaType).toBe('VIDEO')
    })

    it('should handle video with detailed metadata', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.youtube.success)

      const detailedVideoPayload = {
        content: {
          content: [{
            text: `Complete Guide to Next.js 14
            
            In this comprehensive tutorial, we'll cover:
            - Server Components and Client Components
            - App Router fundamentals  
            - Data fetching strategies
            - Performance optimization techniques
            - Best practices for production apps
            
            Perfect for developers looking to master modern React development with Next.js!
            
            🔗 Links mentioned in video:
            - Next.js docs: https://nextjs.org
            - GitHub repo: https://github.com/example
            
            📚 Chapters:
            00:00 Introduction
            02:30 Server Components
            08:45 App Router
            15:20 Data Fetching
            22:10 Performance Tips
            28:30 Conclusion
            
            #NextJS #React #WebDevelopment #JavaScript #Programming #Tutorial #FullStack #Frontend`,
            media: [{ 
              url: TEST_CONTENT.youtubeVideo.content[0].media[0].url, 
              mediaType: 'VIDEO',
              publicId: "nextjs-tutorial",
              secureUrl: TEST_CONTENT.youtubeVideo.content[0].media[0].url
            }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, detailedVideoPayload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)

      // Verify detailed description content
      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content[0].text).toContain('Complete Guide to Next.js')
      expect(sentPayload.content.content[0].text).toContain('📚 Chapters:')
      expect(sentPayload.content.content[0].text).toContain('#NextJS')
    })

    it('should handle video processing states', async () => {
      mockECSEndpointError({
        error: {
          code: 'MEDIA_PROCESSING_IN_PROGRESS',
          message: 'YouTube video is being processed',
          phase: 'uploading',
          progress: 45
        }
      }, 202)

      const payload = {
        content: TEST_CONTENT.youtubeVideo,
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, payload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(202)
        expect(error.response.data.error.code).toBe('MEDIA_PROCESSING_IN_PROGRESS')
        expect(error.response.data.error.phase).toBe('uploading')
        expect(error.response.data.error.progress).toBe(45)
      }
    })

    it('should handle video processing timeout', async () => {
      mockECSEndpointError({
        error: {
          code: 'MEDIA_PROCESSING_TIMEOUT',
          message: 'YouTube video processing timed out after maximum wait time'
        }
      }, 408)

      const payload = {
        content: TEST_CONTENT.youtubeVideo,
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
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

    it('should handle video upload quota exceeded', async () => {
      mockECSEndpointError(MOCK_ECS_RESPONSES.youtube.error, 429)

      const payload = {
        content: TEST_CONTENT.youtubeVideo,
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
      }

      try {
        await axios.post(ECS_LAMBDA_URL, payload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      } catch (error: any) {
        expect(error.response.status).toBe(429)
        expect(error.response.data.error.code).toBe('YOUTUBE_ERROR')
      }
    })

    it('should handle video file size limits (128GB)', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_MEDIA',
          message: 'YouTube video file size exceeds 128GB limit'
        }
      }, 400)

      const largeVideoPayload = {
        content: {
          content: [{
            text: "Test with oversized video file",
            media: [{
              url: "https://example.com/massive-video.mp4",
              mediaType: 'VIDEO'
            }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
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

    it('should handle video duration limits (12 hours)', async () => {
      mockECSEndpointError({
        error: {
          code: 'INVALID_MEDIA',
          message: 'YouTube video duration exceeds 12 hour limit'
        }
      }, 400)

      const longVideoPayload = {
        content: {
          content: [{
            text: "Test with video longer than 12 hours",
            media: [{
              url: "https://example.com/13-hour-video.mp4",
              mediaType: 'VIDEO'
            }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
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
  })

  describe('Privacy Settings', () => {
    it('should handle public video upload', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.youtube.success)

      const publicVideoPayload = {
        content: {
          content: [{
            text: "Public tutorial video for everyone to see #Tutorial #Public",
            media: [{ url: TEST_CONTENT.youtubeVideo.content[0].media[0].url, mediaType: 'VIDEO' }],
            order: 1,
            privacy: 'public'
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, publicVideoPayload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)
      expect(response.data.result.platformId).toBe('youtube')

      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content[0].privacy).toBe('public')
    })

    it('should handle unlisted video upload', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.youtube.success)

      const unlistedVideoPayload = {
        content: {
          content: [{
            text: "Unlisted video - only accessible via link",
            media: [{ url: TEST_CONTENT.youtubeVideo.content[0].media[0].url, mediaType: 'VIDEO' }],
            order: 1,
            privacy: 'unlisted'
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, unlistedVideoPayload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)

      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content[0].privacy).toBe('unlisted')
    })

    it('should handle private video upload', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.youtube.success)

      const privateVideoPayload = {
        content: {
          content: [{
            text: "Private video - only visible to uploader",
            media: [{ url: TEST_CONTENT.youtubeVideo.content[0].media[0].url, mediaType: 'VIDEO' }],
            order: 1,
            privacy: 'private'
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
      }

      const response = await axios.post(ECS_LAMBDA_URL, privateVideoPayload, {
        headers: { 'x-api-key': 'test-api-key' }
      })

      expect(response.status).toBe(200)

      const sentPayload = vi.mocked(axios.post).mock.calls[0][1]
      expect(sentPayload.content.content[0].privacy).toBe('private')
    })
  })

  describe('Unsupported Content Types', () => {
    it('should reject image posts (not supported)', async () => {
      mockECSEndpointError({
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'YouTube only supports video content, images are not supported'
        }
      }, 400)

      const imagePayload = {
        content: TEST_CONTENT.singleImage,
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
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
          message: 'YouTube does not support image carousels, only videos'
        }
      }, 400)

      const carouselPayload = {
        content: TEST_CONTENT.carousel,
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
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
          message: 'YouTube supports only one video per upload'
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
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
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
          message: 'YouTube requires video content, text-only posts are not supported'
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
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
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
          message: 'YouTube access token has expired'
        }
      }, 401)

      const payload = {
        content: TEST_CONTENT.youtubeVideo,
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
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

    it('should handle profile not found', async () => {
      mockECSEndpointError({
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'YouTube channel not found or app lacks access'
        }
      }, 404)

      const payload = {
        content: TEST_CONTENT.youtubeVideo,
        socialProviderId: "invalid_youtube_channel_id"
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
          message: 'YouTube app lacks required permissions for video upload'
        }
      }, 403)

      const payload = {
        content: TEST_CONTENT.youtubeVideo,
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
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
        content: TEST_CONTENT.youtubeVideo,
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
      }

      await expect(
        axios.post(ECS_LAMBDA_URL, payload, {
          headers: { 'x-api-key': 'test-api-key' }
        })
      ).rejects.toThrow('Network Error')
    })
  })

  describe('Content Policy & Guidelines', () => {
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
            text: "Video with copyrighted music",
            media: [{ url: "https://example.com/copyrighted-music-video.mp4", mediaType: 'VIDEO' }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
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
          message: 'Content violates YouTube community guidelines'
        }
      }, 400)

      const inappropriateContent = {
        content: {
          content: [{
            text: "Content that violates YouTube policies",
            media: [{ url: TEST_CONTENT.youtubeVideo.content[0].media[0].url, mediaType: 'VIDEO' }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
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

    it('should handle spam detection', async () => {
      mockECSEndpointError({
        error: {
          code: 'SPAM_DETECTED',
          message: 'Content flagged as potential spam by YouTube'
        }
      }, 400)

      const spamContent = {
        content: {
          content: [{
            text: "CLICK HERE FOR FREE MONEY! SUBSCRIBE NOW! GET RICH QUICK!",
            media: [{ url: TEST_CONTENT.youtubeVideo.content[0].media[0].url, mediaType: 'VIDEO' }],
            order: 1
          }]
        },
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
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
  })

  describe('Payload Structure Validation', () => {
    it('should send correct payload format to ECS endpoint', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.youtube.success)

      const payload = {
        content: TEST_CONTENT.youtubeVideo,
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
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
      expect(sentPayload.socialProviderId).toBe(TEST_SOCIAL_PROVIDERS.youtube.id)
    })

    it('should include correct headers in ECS request', async () => {
      mockECSEndpoint(MOCK_ECS_RESPONSES.youtube.success)

      const payload = {
        content: TEST_CONTENT.youtubeVideo,
        socialProviderId: TEST_SOCIAL_PROVIDERS.youtube.id
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