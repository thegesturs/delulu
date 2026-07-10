import { Effect, Exit, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { apiError, invalidMedia, ConnectionError } from "../../errors";
import { ConvexClient } from "../../services/convex";
import { instagramRules } from "./rules";
import { instagramPublisher } from "./publish";

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
    // Stub the Convex service so no network is touched.
    const StubConvex = Layer.succeed(ConvexClient, {
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
            content: [{ order: 0, name: "c", text: "hi", media: [media("IMAGE")], tags: [] }],
          },
        })
        .pipe(Effect.provide(StubConvex))
    );

    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      const error = exit.cause._tag === "Fail" ? exit.cause.error : undefined;
      expect(error).toBeInstanceOf(ConnectionError);
      expect((error as ConnectionError).code).toBe("PROFILE_NOT_FOUND");
    }
  });
});
