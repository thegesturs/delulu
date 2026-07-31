import axios from "axios";
import { Effect, Layer } from "effect";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConnectionStore } from "../../services/connection-store";
import {
  buildTikTokCommercialFields,
  buildTikTokPhotoPost,
  tiktokPublisher,
} from "./publish";
import { tiktokRules } from "./rules";

const media = (mediaType: "IMAGE" | "VIDEO", name: string) => ({
  mediaType,
  url: `https://media.example.test/${name}`,
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("TikTok photo publishing contract", () => {
  it("builds a Direct Post photo-carousel request", () => {
    expect(
      buildTikTokPhotoPost(
        [
          "https://media.example.test/one.jpg",
          "https://media.example.test/two.jpg",
        ],
        "Carousel title",
        {
          privacy: "SELF_ONLY",
          allowComments: false,
          allowDuet: true,
          allowStitch: true,
          promotionContent: "NONE",
        }
      )
    ).toEqual({
      media_type: "PHOTO",
      post_mode: "DIRECT_POST",
      post_info: {
        title: "Carousel title",
        description: "Carousel title",
        privacy_level: "SELF_ONLY",
        disable_comment: true,
        auto_add_music: true,
        brand_organic_toggle: false,
        brand_content_toggle: false,
      },
      source_info: {
        source: "PULL_FROM_URL",
        photo_images: [
          "https://media.example.test/one.jpg",
          "https://media.example.test/two.jpg",
        ],
        photo_cover_index: 0,
      },
    });
  });

  it("maps commercial disclosures to TikTok's current field names", () => {
    expect(buildTikTokCommercialFields("SELF")).toEqual({
      brand_organic_toggle: true,
      brand_content_toggle: false,
    });
    expect(buildTikTokCommercialFields("PAID")).toEqual({
      brand_organic_toggle: false,
      brand_content_toggle: true,
    });
    expect(buildTikTokCommercialFields("BOTH")).toEqual({
      brand_organic_toggle: true,
      brand_content_toggle: true,
    });
  });

  it("publishes a persisted photo carousel with the current token", async () => {
    const update = vi.fn(() => Effect.void);
    const Store = Layer.succeed(ConnectionStore, {
      getSocialProviderWithDecryptedTokens: () =>
        Effect.succeed({
          _id: "connection_tiktok",
          socialType: "TIKTOK" as const,
          accessToken: "current-access-token",
          refreshToken: "current-refresh-token",
          expiresIn: Date.now() + 12 * 60 * 60 * 1000,
          profileId: "creator_1",
          username: "creator",
        }),
      updateSocialProvider: update,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              creator_username: "creator",
              privacy_level_options: ["SELF_ONLY"],
              max_video_post_duration_sec: 600,
            },
            error: { code: "ok" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );
    vi.spyOn(axios, "post")
      .mockResolvedValueOnce({ data: { data: { publish_id: "publish_1" } } })
      .mockResolvedValueOnce({
        data: { data: { status: "PUBLISH_COMPLETE" } },
      });
    const persistProviderState = vi.fn().mockResolvedValue(undefined);

    const result = await Effect.runPromise(
      tiktokPublisher
        .publish({
          socialProviderId: "connection_tiktok",
          persistProviderState,
          content: {
            postId: "post_1",
            socialProviderId: "connection_tiktok",
            content: [
              {
                order: 0,
                name: "Carousel",
                text: "Carousel title",
                tags: [],
                media: [media("IMAGE", "one.jpg"), media("IMAGE", "two.jpg")],
              },
            ],
            providerSettings: {
              socialProviderId: "connection_tiktok",
              type: "TIKTOK",
              settings: {
                privacy: "SELF_ONLY",
                allowComments: false,
                allowDuet: false,
                allowStitch: false,
                promotionContent: "NONE",
              },
            },
          },
        })
        .pipe(Effect.provide(Store))
    );

    expect(result.platformPostId).toBe("publish_1");
    expect(persistProviderState).toHaveBeenNthCalledWith(1, {
      tiktokStatus: "INITIATED",
      tiktokPublishId: "publish_1",
    });
    expect(persistProviderState).toHaveBeenCalledWith({
      tiktokStatus: "PUBLISH_COMPLETE",
      tiktokPublishId: "publish_1",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("resumes status polling from a durably initiated publish", async () => {
    const Store = Layer.succeed(ConnectionStore, {
      getSocialProviderWithDecryptedTokens: () =>
        Effect.succeed({
          _id: "connection_tiktok",
          socialType: "TIKTOK" as const,
          accessToken: "current-access-token",
          expiresIn: Date.now() + 12 * 60 * 60 * 1000,
          profileId: "creator_1",
          username: "creator",
        }),
      updateSocialProvider: () => Effect.void,
    });
    const post = vi.spyOn(axios, "post").mockResolvedValueOnce({
      data: { data: { status: "PUBLISH_COMPLETE" } },
    });
    const persistProviderState = vi.fn().mockResolvedValue(undefined);

    const result = await Effect.runPromise(
      tiktokPublisher
        .publish({
          socialProviderId: "connection_tiktok",
          providerState: {
            tiktokStatus: "INITIATED",
            tiktokPublishId: "publish_existing",
          },
          persistProviderState,
          content: {
            postId: "post_resume",
            socialProviderId: "connection_tiktok",
            content: [
              {
                order: 0,
                name: "Carousel",
                text: "Resume carousel",
                tags: [],
                media: [media("IMAGE", "one.jpg")],
              },
            ],
            providerSettings: {
              socialProviderId: "connection_tiktok",
              type: "TIKTOK",
              settings: {
                privacy: "SELF_ONLY",
                allowComments: false,
                allowDuet: false,
                allowStitch: false,
                promotionContent: "NONE",
              },
            },
          },
        })
        .pipe(Effect.provide(Store))
    );

    expect(result.platformPostId).toBe("publish_existing");
    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0]?.[0]).toContain("status/fetch");
    expect(persistProviderState).toHaveBeenCalledWith({
      tiktokStatus: "PUBLISH_COMPLETE",
      tiktokPublishId: "publish_existing",
    });
  });
});

describe("TikTok creator limits", () => {
  it("rejects interaction flags disabled by the creator account", async () => {
    const Store = Layer.succeed(ConnectionStore, {
      getSocialProviderWithDecryptedTokens: () =>
        Effect.succeed({
          _id: "connection_tiktok",
          socialType: "TIKTOK" as const,
          accessToken: "current-access-token",
          profileId: "creator_1",
        }),
      updateSocialProvider: () => Effect.void,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              creator_username: "creator",
              privacy_level_options: ["SELF_ONLY"],
              duet_disabled: true,
              stitch_disabled: true,
              max_video_post_duration_sec: 60,
            },
            error: { code: "ok" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );
    const post = vi.spyOn(axios, "post");

    await expect(
      Effect.runPromise(
        tiktokPublisher
          .publish({
            socialProviderId: "connection_tiktok",
            content: {
              postId: "post_1",
              socialProviderId: "connection_tiktok",
              content: [
                {
                  order: 0,
                  name: "Video",
                  text: "Creator restriction",
                  tags: [],
                  media: [media("VIDEO", "clip.mp4")],
                },
              ],
              providerSettings: {
                socialProviderId: "connection_tiktok",
                type: "TIKTOK",
                settings: {
                  privacy: "SELF_ONLY",
                  allowComments: false,
                  allowDuet: true,
                  allowStitch: true,
                  promotionContent: "NONE",
                },
              },
            },
          })
          .pipe(Effect.provide(Store))
      )
    ).rejects.toMatchObject({ code: "PUBLISH_REJECTED" });
    expect(post).not.toHaveBeenCalled();
  });

  it("rejects a video longer than the creator's current maximum", async () => {
    const Store = Layer.succeed(ConnectionStore, {
      getSocialProviderWithDecryptedTokens: () =>
        Effect.succeed({
          _id: "connection_tiktok",
          socialType: "TIKTOK" as const,
          accessToken: "current-access-token",
          profileId: "creator_1",
          username: "creator",
        }),
      updateSocialProvider: () => Effect.void,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              creator_username: "creator",
              privacy_level_options: ["SELF_ONLY"],
              max_video_post_duration_sec: 60,
            },
            error: { code: "ok" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );
    const post = vi.spyOn(axios, "post");

    await expect(
      Effect.runPromise(
        tiktokPublisher
          .publish({
            socialProviderId: "connection_tiktok",
            content: {
              postId: "post_1",
              socialProviderId: "connection_tiktok",
              content: [
                {
                  order: 0,
                  name: "Video",
                  text: "Too long",
                  tags: [],
                  media: [
                    {
                      ...media("VIDEO", "long.mp4"),
                      durationSeconds: 61,
                    },
                  ],
                },
              ],
              providerSettings: {
                socialProviderId: "connection_tiktok",
                type: "TIKTOK",
                settings: {
                  privacy: "SELF_ONLY",
                  allowComments: false,
                  allowDuet: false,
                  allowStitch: false,
                  promotionContent: "NONE",
                },
              },
            },
          })
          .pipe(Effect.provide(Store))
      )
    ).rejects.toMatchObject({ code: "INVALID_MEDIA" });
    expect(post).not.toHaveBeenCalled();
  });
});

describe("TikTok publishing capabilities", () => {
  it("accepts a photo carousel", () => {
    const result = tiktokRules.validate({
      text: "A photo carousel",
      media: [media("IMAGE", "one.jpg"), media("IMAGE", "two.jpg")],
    });

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("accepts a single video", () => {
    const result = tiktokRules.validate({
      text: "A video",
      media: [media("VIDEO", "clip.mp4")],
    });

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("rejects mixed photos and video", () => {
    const result = tiktokRules.validate({
      text: "Mixed media",
      media: [media("IMAGE", "one.jpg"), media("VIDEO", "clip.mp4")],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "TikTok does not support mixing photos and video"
    );
  });
});
