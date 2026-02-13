import type { ProviderSetting } from "@delulu/validators/post";
import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios);

// Mock the Convex client and keys
vi.mock("@delulu/database/node", () => ({
  convex: {
    query: vi.fn(),
  },
}));

vi.mock("../key", () => ({
  keys: () => ({
    INSTAGRAM_CLIENT_ID: "test-client-id",
    INSTAGRAM_CALLBACK_URL: "https://example.com/callback",
  }),
}));

// Mock the Convex query for getProfile
import { convex } from "@delulu/database/node";

const MOCK_PROFILE = {
  _id: "test-provider-id",
  profileId: "123456789",
  accessToken: "test-access-token",
  username: "testuser",
};

describe("Instagram Trial Reels", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock getProfile query
    vi.mocked(convex.query).mockResolvedValue(MOCK_PROFILE);

    // Mock successful container creation
    mockedAxios.post.mockResolvedValueOnce({
      data: { id: "container-123" },
    });

    // Mock container status check (FINISHED)
    mockedAxios.get.mockResolvedValueOnce({
      data: { id: "container-123", status_code: "FINISHED" },
    });

    // Mock media publish
    mockedAxios.post.mockResolvedValueOnce({
      data: { id: "media-456" },
    });

    // Mock get media details
    mockedAxios.get.mockResolvedValueOnce({
      data: { id: "media-456", permalink: "https://www.instagram.com/p/test" },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const VIDEO_CONTENT = {
    content: [
      {
        order: 0,
        name: "DEFAULT",
        media: [
          {
            url: "https://example.com/video.mp4",
            mediaType: "VIDEO" as const,
          },
        ],
        text: "Test caption",
        tags: [],
      },
    ],
    postId: "test-post-id",
    socialProviderId: "test-provider-id",
  };

  const IMAGE_CONTENT = {
    content: [
      {
        order: 0,
        name: "DEFAULT",
        media: [
          {
            url: "https://example.com/image.png",
            mediaType: "IMAGE" as const,
          },
        ],
        text: "Test caption",
        tags: [],
      },
    ],
    postId: "test-post-id",
    socialProviderId: "test-provider-id",
  };

  it("should append trial_params when trialReels is enabled with MANUAL strategy", async () => {
    const { instagramProvider } = await import(
      "../providers/instagram.provider"
    );

    const providerSettings: ProviderSetting = {
      socialProviderId: "test-provider-id",
      type: "INSTAGRAM",
      settings: {
        shareToFeed: true,
        shareToStory: false,
        trialReels: true,
        graduationStrategy: "MANUAL",
      },
    };

    await instagramProvider.publish({
      content: { ...VIDEO_CONTENT, providerSettings },
      socialProviderId: "test-provider-id",
    });

    // First axios.post call is the container creation
    const containerCallUrl = mockedAxios.post.mock.calls[0][0] as string;
    const params = new URLSearchParams(containerCallUrl.split("?")[1]);

    expect(params.get("trial_params")).toBe(
      JSON.stringify({ graduation_strategy: "MANUAL" })
    );
  });

  it("should append trial_params with SS_PERFORMANCE strategy", async () => {
    const { instagramProvider } = await import(
      "../providers/instagram.provider"
    );

    const providerSettings: ProviderSetting = {
      socialProviderId: "test-provider-id",
      type: "INSTAGRAM",
      settings: {
        shareToFeed: true,
        shareToStory: false,
        trialReels: true,
        graduationStrategy: "SS_PERFORMANCE",
      },
    };

    await instagramProvider.publish({
      content: { ...VIDEO_CONTENT, providerSettings },
      socialProviderId: "test-provider-id",
    });

    const containerCallUrl = mockedAxios.post.mock.calls[0][0] as string;
    const params = new URLSearchParams(containerCallUrl.split("?")[1]);

    expect(params.get("trial_params")).toBe(
      JSON.stringify({ graduation_strategy: "SS_PERFORMANCE" })
    );
  });

  it("should NOT append trial_params when trialReels is disabled", async () => {
    const { instagramProvider } = await import(
      "../providers/instagram.provider"
    );

    const providerSettings: ProviderSetting = {
      socialProviderId: "test-provider-id",
      type: "INSTAGRAM",
      settings: {
        shareToFeed: true,
        shareToStory: false,
        trialReels: false,
        graduationStrategy: "MANUAL",
      },
    };

    await instagramProvider.publish({
      content: { ...VIDEO_CONTENT, providerSettings },
      socialProviderId: "test-provider-id",
    });

    const containerCallUrl = mockedAxios.post.mock.calls[0][0] as string;
    const params = new URLSearchParams(containerCallUrl.split("?")[1]);

    expect(params.get("trial_params")).toBeNull();
  });

  it("should NOT append trial_params when no providerSettings provided", async () => {
    const { instagramProvider } = await import(
      "../providers/instagram.provider"
    );

    await instagramProvider.publish({
      content: VIDEO_CONTENT,
      socialProviderId: "test-provider-id",
    });

    const containerCallUrl = mockedAxios.post.mock.calls[0][0] as string;
    const params = new URLSearchParams(containerCallUrl.split("?")[1]);

    expect(params.get("trial_params")).toBeNull();
  });

  it("should NOT append trial_params for non-video (image) posts", async () => {
    const { instagramProvider } = await import(
      "../providers/instagram.provider"
    );

    const providerSettings: ProviderSetting = {
      socialProviderId: "test-provider-id",
      type: "INSTAGRAM",
      settings: {
        shareToFeed: true,
        shareToStory: false,
        trialReels: true,
        graduationStrategy: "MANUAL",
      },
    };

    await instagramProvider.publish({
      content: { ...IMAGE_CONTENT, providerSettings },
      socialProviderId: "test-provider-id",
    });

    const containerCallUrl = mockedAxios.post.mock.calls[0][0] as string;
    const params = new URLSearchParams(containerCallUrl.split("?")[1]);

    // Images don't have media_type=REELS so trial_params should not be appended
    expect(params.get("trial_params")).toBeNull();
    expect(params.get("media_type")).toBeNull(); // No media_type for single images
  });

  it("should default to MANUAL graduation strategy when not specified", async () => {
    const { instagramProvider } = await import(
      "../providers/instagram.provider"
    );

    const providerSettings: ProviderSetting = {
      socialProviderId: "test-provider-id",
      type: "INSTAGRAM",
      settings: {
        shareToFeed: true,
        shareToStory: false,
        trialReels: true,
        // graduationStrategy intentionally omitted to test default
      } as ProviderSetting extends { type: "INSTAGRAM" }
        ? ProviderSetting["settings"]
        : never,
    };

    await instagramProvider.publish({
      content: { ...VIDEO_CONTENT, providerSettings },
      socialProviderId: "test-provider-id",
    });

    const containerCallUrl = mockedAxios.post.mock.calls[0][0] as string;
    const params = new URLSearchParams(containerCallUrl.split("?")[1]);

    expect(params.get("trial_params")).toBe(
      JSON.stringify({ graduation_strategy: "MANUAL" })
    );
  });
});
