// Social provider IDs and types mapping (updated with real IDs from database)
// cspell:disable-next-line
export const SOCIAL_PROVIDER_DATA = [
  { id: "jd700er0g06x9dvnc7tk22hfcn7zy70f", socialType: "TIKTOK" }, // Real production TikTok account
  { id: "js734bks5yxa8s93yn908x2tqd7pwrv5", socialType: "YOUTUBE" },
  { id: "js72nvt36ep43bpq7qssjy879d7p6atg", socialType: "THREADS" },
  { id: "jd71ygsh8e2n10pha52bpmgxsh809fkb", socialType: "INSTAGRAM" },
  { id: "js7bx2a2ca4rmwjryjxfzg8v597p64bx", socialType: "FACEBOOK" },
  { id: "js762hety6cpas0qx7gtxy38ds7nvg3r", socialType: "LINKEDIN" },
];

export const LAMBDA_URL =
  "https://s6zm4w4r5xrwk5ejhdwcjiy7ry0rhvch.lambda-url.us-east-1.on.aws/";

// Test content data with real Delulu Social media URLs
export const TEST_CONTENT = {
  singleImage: [
    {
      order: 0,
      name: "DEFAULT",
      media: [
        {
          bucketKey:
            "user_30F1kYDnbGXB26mXlyhYQv7XgBn/cba8367f-a208-45fd-b935-162c2f92fec2.png",
          url: "https://media.delulu.social/user_30F1kYDnbGXB26mXlyhYQv7XgBn/cba8367f-a208-45fd-b935-162c2f92fec2.png",
          mediaType: "IMAGE" as const,
        },
      ],
      text: "some posting stuff\n\nnice post and stuff",
      tags: [],
    },
  ],

  carousel: [
    {
      order: 0,
      name: "DEFAULT",
      media: [
        {
          bucketKey:
            "user_30F1kYDnbGXB26mXlyhYQv7XgBn/03eb6890-68c0-466a-86dc-71ffc1f91297.png",
          url: "https://media.delulu.social/user_30F1kYDnbGXB26mXlyhYQv7XgBn/03eb6890-68c0-466a-86dc-71ffc1f91297.png",
          mediaType: "IMAGE" as const,
        },
        {
          bucketKey:
            "user_30F1kYDnbGXB26mXlyhYQv7XgBn/83ae11b0-f201-47a3-8a58-fc5f7e70f3a6.png",
          url: "https://media.delulu.social/user_30F1kYDnbGXB26mXlyhYQv7XgBn/83ae11b0-f201-47a3-8a58-fc5f7e70f3a6.png",
          mediaType: "IMAGE" as const,
        },
      ],
      text: "some posting stuff\n\nnice post and stuff",
      tags: [],
    },
  ],

  video: [
    {
      order: 0,
      name: "DEFAULT",
      media: [
        {
          bucketKey:
            "user_30F1kYDnbGXB26mXlyhYQv7XgBn/331bb161-a69c-40c2-896c-4a6dc78a8ea0.mp4",
          url: "https://media.delulu.social/user_30F1kYDnbGXB26mXlyhYQv7XgBn/331bb161-a69c-40c2-896c-4a6dc78a8ea0.mp4",
          mediaType: "VIDEO" as const,
        },
      ],
      text: "some posting stuff\n\nnice post and stuff",
      tags: [],
    },
  ],

  videoWithThumbnail: [
    {
      order: 0,
      name: "DEFAULT",
      media: [
        {
          bucketKey:
            "user_30F1kYDnbGXB26mXlyhYQv7XgBn/331bb161-a69c-40c2-896c-4a6dc78a8ea0.mp4",
          url: "https://media.delulu.social/user_30F1kYDnbGXB26mXlyhYQv7XgBn/331bb161-a69c-40c2-896c-4a6dc78a8ea0.mp4",
          mediaType: "VIDEO" as const,
          thumbnailTimestamp: 5.5, // Frame at 5.5 seconds
        },
      ],
      text: "Testing video with custom thumbnail at 5.5 seconds",
      tags: [],
    },
  ],

  videoWithCoverImage: [
    {
      order: 0,
      name: "DEFAULT",
      media: [
        {
          bucketKey:
            "user_30F1kYDnbGXB26mXlyhYQv7XgBn/331bb161-a69c-40c2-896c-4a6dc78a8ea0.mp4",
          url: "https://media.delulu.social/user_30F1kYDnbGXB26mXlyhYQv7XgBn/331bb161-a69c-40c2-896c-4a6dc78a8ea0.mp4",
          mediaType: "VIDEO" as const,
          thumbnailBucketUrl:
            "https://media.delulu.social/user_30F1kYDnbGXB26mXlyhYQv7XgBn/cba8367f-a208-45fd-b935-162c2f92fec2.png",
        },
      ],
      text: "Testing video with custom cover image",
      tags: [],
    },
  ],

  videoWithBothThumbnailOptions: [
    {
      order: 0,
      name: "DEFAULT",
      media: [
        {
          bucketKey:
            "user_30F1kYDnbGXB26mXlyhYQv7XgBn/331bb161-a69c-40c2-896c-4a6dc78a8ea0.mp4",
          url: "https://media.delulu.social/user_30F1kYDnbGXB26mXlyhYQv7XgBn/331bb161-a69c-40c2-896c-4a6dc78a8ea0.mp4",
          mediaType: "VIDEO" as const,
          thumbnailBucketUrl:
            "https://media.delulu.social/user_30F1kYDnbGXB26mXlyhYQv7XgBn/cba8367f-a208-45fd-b935-162c2f92fec2.png",
          thumbnailTimestamp: 5.5, // Should be ignored when cover_url is present
        },
      ],
      text: "Testing video with both cover image and timestamp (cover takes priority)",
      tags: [],
    },
  ],
};

export const MOCK_POST_ID = "js7example_post_id_for_testing";

// Mock successful response
export const MOCK_SUCCESS_RESPONSE = {
  success: true,
  data: { postId: "platform_post_123", status: "published" },
};

// Mock keys function for testing
export const mockKeys = () => ({
  POSTING_SECRET_KEY: "test-secret-key",
});
