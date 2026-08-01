import { SocialTypes } from "@delulu/validators/post";
import { describe, expect, it } from "vitest";
import {
  getDynamicMediaLimits,
  shouldDefaultUseVideoLayout,
} from "./platform-rules";

describe("TikTok composer media modes", () => {
  it("allows a photo carousel without requiring a video", () => {
    const empty = getDynamicMediaLimits(SocialTypes.TIKTOK, []);
    expect(empty).toMatchObject({
      maxImages: 35,
      maxVideos: 1,
      canAddImages: true,
      canAddVideos: true,
      canMixTypes: false,
    });
    expect(
      getDynamicMediaLimits(SocialTypes.TIKTOK, [{ mediaType: "IMAGE" }])
    ).toMatchObject({
      remainingImages: 34,
      canAddImages: true,
      canAddVideos: false,
    });
  });

  it("keeps video and photo-carousel modes mutually exclusive", () => {
    expect(
      getDynamicMediaLimits(SocialTypes.TIKTOK, [{ mediaType: "VIDEO" }])
    ).toMatchObject({
      canAddImages: false,
      canAddVideos: false,
      canMixTypes: false,
    });
  });

  it("does not force the video-only layout for TikTok", () => {
    expect(shouldDefaultUseVideoLayout([SocialTypes.TIKTOK])).toBe(false);
    expect(shouldDefaultUseVideoLayout([SocialTypes.YOUTUBE])).toBe(true);
  });
});
