// Social provider IDs and types mapping
export const SOCIAL_PROVIDER_DATA = [
  { id: "js72nvt36ep43bpq7qssjy879d7p6atg", socialType: "THREADS" },
  { id: "js7ew09rx9brckw85pvk56vsy57p6xn3", socialType: "INSTAGRAM" },
  { id: "js7bx2a2ca4rmwjryjxfzg8v597p64bx", socialType: "FACEBOOK" },
  { id: "js762hety6cpas0qx7gtxy38ds7nvg3r", socialType: "LINKEDIN" },
  { id: "js7480hp0kspzet4mee0ejrbtd7nsqxq", socialType: "TIKTOK" },
  { id: "js7ct5zvmexj9kxdn0ndh8v97s7mejt7", socialType: "YOUTUBE" },
];

export const LAMBDA_URL = "https://s6zm4w4r5xrwk5ejhdwcjiy7ry0rhvch.lambda-url.us-east-1.on.aws/";

// Test content data
export const TEST_CONTENT = {
  singleImage: [
    {
      order: 1,
      name: "Single Image Post",
      media: [
        {
          url: "https://example.com/test-image.jpg",
          mediaType: "IMAGE" as const,
        }
      ],
      text: "Test single image post"
    }
  ],
  
  carousel: [
    {
      order: 1,
      name: "Carousel Post",
      media: [
        {
          url: "https://example.com/test-image-1.jpg",
          mediaType: "IMAGE" as const,
        },
        {
          url: "https://example.com/test-image-2.jpg",
          mediaType: "IMAGE" as const,
        },
        {
          url: "https://example.com/test-image-3.jpg",
          mediaType: "IMAGE" as const,
        }
      ],
      text: "Test carousel post with multiple images"
    }
  ],
  
  video: [
    {
      order: 1,
      name: "Video Post",
      media: [
        {
          url: "https://example.com/test-video.mp4",
          mediaType: "VIDEO" as const,
        }
      ],
      text: "Test video post"
    }
  ]
};

export const MOCK_POST_ID = "test_post_12345";

// Mock successful response
export const MOCK_SUCCESS_RESPONSE = {
  success: true,
  data: { postId: "platform_post_123", status: "published" }
};

// Mock keys function for testing
export const mockKeys = () => ({
  POSTING_SECRET_KEY: "test-secret-key"
});