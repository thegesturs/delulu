import { beforeEach, describe, expect, it } from "vitest";
import { processMessageTestOnly } from "../test-client";
import { MOCK_POST_ID, SOCIAL_PROVIDER_DATA, TEST_CONTENT } from "./test-data";

const threadsProvider = SOCIAL_PROVIDER_DATA.find(
  (p) => p.socialType === "THREADS"
)!;

describe("Threads Provider Tests", () => {
  beforeEach(() => {
    // Clear any state if needed
  });

  it("should call processMessage for single image", async () => {
    const result = await processMessageTestOnly(
      JSON.stringify({
        socialType: threadsProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.singleImage,
          postId: MOCK_POST_ID,
          socialProviderId: threadsProvider.id,
        },
      })
    );

    // Just verify it didn't crash - result can be undefined if provider fails
    expect(result?.isOk?.() === true).toBe(true);
  });

  it("should call processMessage for carousel", async () => {
    const result = await processMessageTestOnly(
      JSON.stringify({
        socialType: threadsProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.carousel,
          postId: MOCK_POST_ID,
          socialProviderId: threadsProvider.id,
        },
      })
    );

    // Just verify it didn't crash - result can be undefined if provider fails
    expect(result?.isOk?.() === true).toBe(true);
  });

  it("should call processMessage for video", async () => {
    const result = await processMessageTestOnly(
      JSON.stringify({
        socialType: threadsProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.video,
          postId: MOCK_POST_ID,
          socialProviderId: threadsProvider.id,
        },
      })
    );

    // Just verify it didn't crash - result can be undefined if provider fails
    expect(result?.isOk?.() === true).toBe(true);
  });
});
