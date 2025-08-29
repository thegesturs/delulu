// Real social provider tokens and test data for unit testing
// This file contains actual tokens that expire every 2 months and need refreshing

import type { BaseProviderProfile, TikTokProfile, TwitterProfile } from '../providers/common-types'

// Token expiry validation helper
export const isTokenExpired = (expiresIn: number): boolean => {
  return Date.now() > expiresIn
}

export const warnIfTokenExpiring = (provider: string, expiresIn: number) => {
  const daysUntilExpiry = (expiresIn - Date.now()) / (1000 * 60 * 60 * 24)
  if (daysUntilExpiry < 7) {
    console.warn(`⚠️  ${provider} token expires in ${Math.floor(daysUntilExpiry)} days. Please refresh tokens in test-data.ts`)
  }
}

// Real Social Provider Data (Updated: Aug 29, 2025)
export const TEST_SOCIAL_PROVIDERS = {
  // Real Threads token (expires: 2025-10-29)
  threads: {
    _creationTime: 1755961451285.7427,
    _id: "js72nvt36ep43bpq7qssjy879d7p6atg",
    id: "js72nvt36ep43bpq7qssjy879d7p6atg", 
    accessToken: "aIEuwNT0NMhoz4PMpGvBEfTRZjkhzWJxHBCsXHpC55W/5TOfaaogk3AL5VyPdaATcvkNZxWFj4nRs5w4Heghvd9WAHd+HotRNJAAb9yrUtmxwDe3oFMrhbEjtpt2C/3OBpFZjdPXT2NMBUJZrOqBeFlXuChcRnnXWf1Oxiwi3ccqJ0gAn3a00yq1i8ydIcOCAZhCfNz33Le1MSKtgnaokEzL5fvs9atE90GcYifNZNStogxYoY4DxXx1p4zXvyclnN3XVAkJxSq/zVOuU0t/puDjR6a2nfkNBVcMcs0hbOasK384",
    expiresIn: 1761145169394,
    fullName: "some motivation ig",
    isActive: true,
    profileId: "23925631363782745",
    profileImage: "https://scontent-bru2-1.cdninstagram.com/v/t51.75761-15/502519794_18084287890738990_5063045682463042148_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=110&ccb=1-7&_nc_sid=18de74&_nc_ohc=0wlrAtj6VvQQ7kNvwH0KeE5&_nc_oc=AdmFWlDY-hIo4xPQzaD25Gohlk2WgO5XrT5YuFaEF2ztQBZTWK93fAat8qgjT2Gzbhs&_nc_zt=23&_nc_ht=scontent-bru2-1.cdninstagram.com&edm=AP4hL3IEAAAA&_nc_gid=_xsORcJuhHxiujEXlD_PDg&oh=00_AfVoeKoLrDf0ljau_q2f-_2QIK4wIH7f9HMwbJ8bZD5-tg&oe=68AF916C",
    refreshTokenExpiresIn: 1761145450394,
    socialType: "THREADS",
    username: "betamartian"
  } as BaseProviderProfile & { expiresIn: number; refreshTokenExpiresIn: number; socialType: string },

  // Real Instagram token (expires: 2025-10-28) 
  instagram: {
    _creationTime: 1755922993126.3064,
    _id: "js7ew09rx9brckw85pvk56vsy57p6xn3",
    id: "js7ew09rx9brckw85pvk56vsy57p6xn3",
    accessToken: "NA39SFJqiyPMbgraFWL4bM6e2dFwxQVYCWPsJ9FSeBoT3Ftg9Od88tcPL/tvv+7N+T8lbzW9qFqSePOQMHengbUZlgCNN0vV/TKCOofXJmwkTvSpGGKwG813WRxUfvqQQIbE36lBJHM/xH3ygNTognz9a6lA62Ax7M1LB2xRypjb1amENjug6rOamty8j5/ZuEMUK1CdGZkY0/tXh1p4U6Q5hOO0s0B9MUmGUSDYhzafLD5xHmfBqrSV64xHu5zbXhK8wNcm6cmLbzY4",
    expiresIn: 1761106992525,
    fullName: "some motivation ig",
    isActive: true,
    profileId: "10036494419791037", 
    profileImage: "https://scontent-bru2-1.cdninstagram.com/v/t51.75761-15/502519794_18084287890738990_5063045682463042148_n.jpg",
    refreshTokenExpiresIn: 1761107273525,
    socialType: "INSTAGRAM",
    username: "betamartian"
  } as BaseProviderProfile & { expiresIn: number; refreshTokenExpiresIn: number; socialType: string },

  // Placeholder for Facebook (needs real token from you)
  facebook: {
    _id: "facebook_test_profile_id",
    id: "facebook_test_profile_id",
    accessToken: "FACEBOOK_TOKEN_NEEDED", // ⚠️ Replace with real Facebook token
    expiresIn: Date.now() + (60 * 24 * 60 * 60 * 1000), // 60 days from now
    profileId: "facebook_page_id_placeholder",
    username: "facebook_test_account",
    socialType: "FACEBOOK",
    isActive: true
  } as BaseProviderProfile & { expiresIn: number; socialType: string },

  // Placeholder for LinkedIn (needs real token from you)
  linkedin: {
    _id: "linkedin_test_profile_id", 
    id: "linkedin_test_profile_id",
    accessToken: "LINKEDIN_TOKEN_NEEDED", // ⚠️ Replace with real LinkedIn token
    expiresIn: Date.now() + (60 * 24 * 60 * 60 * 1000), // 60 days from now
    profileId: "linkedin_profile_id_placeholder",
    username: "linkedin_test_account",
    socialType: "LINKEDIN",
    isActive: true
  } as BaseProviderProfile & { expiresIn: number; socialType: string },

  // Placeholder for TikTok (needs real token from you)
  tiktok: {
    _id: "tiktok_test_profile_id",
    id: "tiktok_test_profile_id", 
    accessToken: "TIKTOK_TOKEN_NEEDED", // ⚠️ Replace with real TikTok token
    refreshToken: "TIKTOK_REFRESH_TOKEN_NEEDED",
    expiresIn: Date.now() + (60 * 24 * 60 * 60 * 1000), // 60 days from now
    profileId: "tiktok_profile_id_placeholder",
    username: "tiktok_test_account", 
    socialType: "TIKTOK",
    isActive: true
  } as TikTokProfile & { expiresIn: number; socialType: string },

  // Placeholder for YouTube (needs real token from you)
  youtube: {
    _id: "youtube_test_profile_id",
    id: "youtube_test_profile_id",
    accessToken: "YOUTUBE_TOKEN_NEEDED", // ⚠️ Replace with real YouTube token
    refreshToken: "YOUTUBE_REFRESH_TOKEN_NEEDED",
    expiresIn: Date.now() + (60 * 24 * 60 * 60 * 1000), // 60 days from now
    profileId: "youtube_channel_id_placeholder",
    username: "youtube_test_channel",
    socialType: "YOUTUBE", 
    isActive: true
  } as TwitterProfile & { expiresIn: number; socialType: string }
}

// Test Media URLs (you can update these with preferred test assets)
export const TEST_MEDIA = {
  images: {
    single: "https://images.unsplash.com/photo-1516315607641-5e0b7ff6c10c?w=800&h=600",
    carousel: [
      "https://images.unsplash.com/photo-1516315607641-5e0b7ff6c10c?w=800&h=600",
      "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800&h=600",
      "https://images.unsplash.com/photo-1533134486753-c833f0ed4866?w=800&h=600"
    ]
  },
  videos: {
    short: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // 15s sample
    reel: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", // ~1min sample
    long: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4" // 12min sample for YouTube
  }
}

// Test Content Data Structures
export const TEST_CONTENT = {
  singleImage: {
    content: [{
      text: "Test post with single image #testing",
      media: [{ 
        url: TEST_MEDIA.images.single, 
        mediaType: 'IMAGE' as const,
        publicId: "test-single-image",
        secureUrl: TEST_MEDIA.images.single
      }],
      order: 1
    }]
  },

  carousel: {
    content: [{
      text: "Test carousel post with multiple images #carousel #testing",
      media: TEST_MEDIA.images.carousel.map((url, index) => ({
        url,
        mediaType: 'IMAGE' as const,
        publicId: `test-carousel-${index + 1}`,
        secureUrl: url
      })),
      order: 1
    }]
  },

  singleVideo: {
    content: [{
      text: "Test video post #video #testing",
      media: [{
        url: TEST_MEDIA.videos.short,
        mediaType: 'VIDEO' as const,
        publicId: "test-video",
        secureUrl: TEST_MEDIA.videos.short
      }],
      order: 1
    }]
  },

  reel: {
    content: [{
      text: "Test reel video #reel #testing",
      media: [{
        url: TEST_MEDIA.videos.reel,
        mediaType: 'VIDEO' as const,
        publicId: "test-reel",
        secureUrl: TEST_MEDIA.videos.reel
      }],
      order: 1
    }]
  },

  youtubeVideo: {
    content: [{
      text: "Test YouTube video upload #youtube #testing",
      media: [{
        url: TEST_MEDIA.videos.long,
        mediaType: 'VIDEO' as const,
        publicId: "test-youtube-video",
        secureUrl: TEST_MEDIA.videos.long
      }],
      order: 1
    }]
  }
}

// ECS Lambda URL for testing
export const ECS_LAMBDA_URL = "https://s6zm4w4r5xrwk5ejhdwcjiy7ry0rhvch.lambda-url.us-east-1.on.aws/"

// Helper to validate token expiry and warn
export const validateTokens = () => {
  Object.entries(TEST_SOCIAL_PROVIDERS).forEach(([provider, data]) => {
    if ('expiresIn' in data) {
      if (isTokenExpired(data.expiresIn)) {
        console.error(`❌ ${provider} token has expired! Please refresh tokens in test-data.ts`)
      } else {
        warnIfTokenExpiring(provider, data.expiresIn)
      }
    }
  })
}

// Mock successful ECS responses for each platform
export const MOCK_ECS_RESPONSES = {
  instagram: {
    success: {
      result: {
        platformPostId: "instagram_post_123",
        postId: "test_post_id",
        platformId: "instagram", 
        platformPostUrl: "https://www.instagram.com/p/test123/",
        postedAt: new Date().toISOString()
      }
    },
    error: {
      error: {
        code: "MEDIA_UPLOAD_FAILED",
        message: "Failed to upload media to Instagram"
      }
    }
  },

  threads: {
    success: {
      result: {
        platformPostId: "threads_post_123",
        postId: "test_post_id", 
        platformId: "threads",
        platformPostUrl: "https://www.threads.net/t/test123",
        postedAt: new Date().toISOString()
      }
    },
    error: {
      error: {
        code: "PUBLISH_FAILED",
        message: "Failed to publish to Threads"
      }
    }
  },

  facebook: {
    success: {
      result: {
        platformPostId: "facebook_post_123",
        postId: "test_post_id",
        platformId: "facebook",
        platformPostUrl: "https://www.facebook.com/post/test123", 
        postedAt: new Date().toISOString()
      }
    },
    error: {
      error: {
        code: "API_ERROR",
        message: "Facebook API rate limit exceeded"
      }
    }
  },

  linkedin: {
    success: {
      result: {
        platformPostId: "linkedin_post_123",
        postId: "test_post_id",
        platformId: "linkedin",
        platformPostUrl: "https://www.linkedin.com/posts/test123",
        postedAt: new Date().toISOString()
      }
    },
    error: {
      error: {
        code: "INVALID_ACCESS_TOKEN",
        message: "LinkedIn access token has expired"
      }
    }
  },

  tiktok: {
    success: {
      result: {
        platformPostId: "tiktok_video_123",
        postId: "test_post_id", 
        platformId: "tiktok",
        platformPostUrl: "https://www.tiktok.com/@user/video/test123",
        postedAt: new Date().toISOString()
      }
    },
    error: {
      error: {
        code: "MEDIA_PROCESSING_FAILED",
        message: "TikTok video processing failed"
      }
    }
  },

  youtube: {
    success: {
      result: {
        platformPostId: "youtube_video_123",
        postId: "test_post_id",
        platformId: "youtube", 
        platformPostUrl: "https://www.youtube.com/watch?v=test123",
        postedAt: new Date().toISOString()
      }
    },
    error: {
      error: {
        code: "YOUTUBE_ERROR", 
        message: "YouTube video upload quota exceeded"
      }
    }
  }
}