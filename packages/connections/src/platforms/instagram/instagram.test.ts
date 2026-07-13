import { Cause, Effect, Exit, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { apiError, invalidMedia, isConnectionError } from "../../errors";
import { ConnectionStore } from "../../services/connection-store";
import { buildSingleContainerParams, instagramPublisher } from "./publish";
import { instagramRules } from "./rules";

const media = (mediaType: "IMAGE" | "VIDEO", url = "https://x/y.jpg") => ({
  url,
  mediaType,
});

describe("instagramRules.validate", () => {
  it("rejects a caption over the 2200 char limit", () => {
    const result = instagramRules.validate({
      text: "a".repeat(2201),
      media: [media("IMAGE")],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Caption exceeds Instagram's 2200 character limit"
    );
  });

  it("requires at least one media item", () => {
    const result = instagramRules.validate({ text: "hi", media: [] });
    expect(result.valid).toBe(false);
  });

  it("rejects mixing video and images", () => {
    const result = instagramRules.validate({
      text: "hi",
      media: [media("VIDEO", "https://x/v.mp4"), media("IMAGE")],
    });
    expect(result.valid).toBe(false);
  });

  it("accepts a single image", () => {
    const result = instagramRules.validate({
      text: "hi",
      media: [media("IMAGE")],
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe("Instagram video container parameters", () => {
  it("sends an uploaded cover image instead of a timestamp", () => {
    const params = buildSingleContainerParams(
      {
        url: "https://media.test/video.mp4",
        mediaType: "VIDEO",
        thumbnailBucketUrl: "https://media.test/cover.jpg",
        thumbnailTimestamp: 12,
      },
      "token",
      "caption"
    );

    expect(params.get("cover_url")).toBe("https://media.test/cover.jpg");
    expect(params.has("thumb_offset")).toBe(false);
  });

  it("sends trial reel parameters when the toggle is enabled", () => {
    const params = buildSingleContainerParams(
      { url: "https://media.test/video.mp4", mediaType: "VIDEO" },
      "token",
      "caption",
      {
        socialProviderId: "connection_1",
        type: "INSTAGRAM",
        settings: {
          shareToFeed: true,
          shareToStory: false,
          trialReels: true,
          graduationStrategy: "SS_PERFORMANCE",
        },
      }
    );

    expect(JSON.parse(params.get("trial_params") ?? "null")).toEqual({
      graduation_strategy: "SS_PERFORMANCE",
    });
  });
});

describe("error retryable classification", () => {
  it("marks HTTP 429 / 5xx retryable and 4xx not", () => {
    expect(apiError("Instagram", 429).retryable).toBe(true);
    expect(apiError("Instagram", 503).retryable).toBe(true);
    expect(apiError("Instagram", 400).retryable).toBe(false);
    expect(invalidMedia("Instagram", "bad").retryable).toBe(false);
  });
});

describe("instagramPublisher.publish (Effect DI)", () => {
  it("fails with PROFILE_NOT_FOUND when the provider has no token", async () => {
    // Stub the connection store so no network is touched.
    const StubStore = Layer.succeed(ConnectionStore, {
      getSocialProviderWithDecryptedTokens: () => Effect.succeed(null),
      updateSocialProvider: () => Effect.void,
    });

    const exit = await Effect.runPromiseExit(
      instagramPublisher
        .publish({
          socialProviderId: "sp_1",
          content: {
            postId: "post_1",
            socialProviderId: "sp_1",
            content: [
              {
                order: 0,
                name: "c",
                text: "hi",
                media: [media("IMAGE")],
                tags: [],
              },
            ],
          },
        })
        .pipe(Effect.provide(StubStore))
    );

    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      const error = Cause.findErrorOption(exit.cause);
      expect(error._tag).toBe("Some");
      if (error._tag === "Some") {
        expect(isConnectionError(error.value)).toBe(true);
        expect(error.value.code).toBe("PROFILE_NOT_FOUND");
      }
    }
  });
});
