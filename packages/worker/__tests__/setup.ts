// Global test setup for social media provider tests

import { vi } from 'vitest'

// Mock axios to prevent actual API calls during tests
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

// Mock googleapis for YouTube tests
vi.mock('googleapis', () => ({
  youtube: vi.fn(() => ({
    videos: {
      insert: vi.fn(),
      list: vi.fn(),
    },
  })),
  auth: {
    OAuth2: vi.fn(),
  },
}))

// Mock Twitter API SDK
vi.mock('twitter-api-sdk', () => ({
  Client: vi.fn(() => ({
    tweets: {
      createTweet: vi.fn(),
    },
  })),
}))

// Mock Convex database calls
vi.mock('@delulu/database/convex/_generated/api', () => ({
  api: {
    socialProviders: {
      getMany: vi.fn(),
    },
  },
}))

vi.mock('@delulu/database/node', () => ({
  convex: {
    query: vi.fn(),
    mutation: vi.fn(),
  },
}))

// Setup global test environment
global.console.log = vi.fn() // Suppress console logs in tests
global.console.warn = vi.fn()
global.console.error = vi.fn()

// Helper to create mock ECS endpoint response
global.mockECSEndpoint = (response: any, status = 200) => {
  const axios = require('axios')
  axios.post.mockResolvedValueOnce({
    status,
    data: response,
  })
}

// Helper to simulate ECS endpoint errors
global.mockECSEndpointError = (error: any, status = 500) => {
  const axios = require('axios')
  axios.post.mockRejectedValueOnce({
    response: {
      status,
      data: error,
    },
  })
}

// Clear all mocks after each test
afterEach(() => {
  vi.clearAllMocks()
})