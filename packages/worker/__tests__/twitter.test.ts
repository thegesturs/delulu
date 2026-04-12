import { describe, expect, it } from "vitest";
import { processMessageTestOnly } from "../test-client";
import { MOCK_POST_ID, SOCIAL_PROVIDER_DATA, TEST_CONTENT } from "./test-data";

const twitterProvider = SOCIAL_PROVIDER_DATA.find(
  (p) => p.socialType === "TWITTER"
)!;

const isConfigured =
  twitterProvider?.id && !twitterProvider.id.startsWith("REPLACE_WITH");

describe.skipIf(!isConfigured)("Twitter Provider Tests", () => {
  it("should execute real Twitter provider with single image", async () => {
    const result = await processMessageTestOnly(
      JSON.stringify({
        socialType: twitterProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.singleImage,
          postId: MOCK_POST_ID,
          socialProviderId: twitterProvider.id,
        },
      })
    );

    expect(result?.isOk?.() === true).toBe(true);
  });

  it("should execute real Twitter provider with carousel", async () => {
    const result = await processMessageTestOnly(
      JSON.stringify({
        socialType: twitterProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.carousel,
          postId: MOCK_POST_ID,
          socialProviderId: twitterProvider.id,
        },
      })
    );

    expect(result?.isOk?.() === true).toBe(true);
  });

  it("should execute real Twitter provider with video", async () => {
    const result = await processMessageTestOnly(
      JSON.stringify({
        socialType: twitterProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.video,
          postId: MOCK_POST_ID,
          socialProviderId: twitterProvider.id,
        },
      })
    );

    expect(result?.isOk?.() === true).toBe(true);
  });

  it("should execute real Twitter provider with thread", async () => {
    const result = await processMessageTestOnly(
      JSON.stringify({
        socialType: twitterProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.thread,
          postId: MOCK_POST_ID,
          socialProviderId: twitterProvider.id,
        },
      })
    );

    expect(result?.isOk?.() === true).toBe(true);
  });
});
