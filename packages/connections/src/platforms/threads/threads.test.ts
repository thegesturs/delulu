import axios from "axios";
import { Effect, Layer } from "effect";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConnectionStore } from "../../services/connection-store";
import { threadsPublisher } from "./publish";
import { threadsRules } from "./rules";

const Store = Layer.succeed(ConnectionStore, {
  getSocialProviderWithDecryptedTokens: () =>
    Effect.succeed({
      _id: "connection_threads",
      socialType: "THREADS" as const,
      accessToken: "threads-access",
      expiresIn: Date.now() + 12 * 60 * 60 * 1000,
      profileId: "threads-profile",
      username: "threads-user",
    }),
  updateSocialProvider: () => Effect.void,
});

const content = (
  segments: Array<{
    text: string;
    media: Array<{ mediaType: "IMAGE" | "VIDEO"; url: string }>;
  }>
) => ({
  postId: "post_threads",
  socialProviderId: "connection_threads",
  content: segments.map((segment, order) => ({
    order,
    name: `Segment ${order + 1}`,
    tags: [],
    ...segment,
  })),
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Threads publishing", () => {
  it("publishes text and returns the provider permalink", async () => {
    const post = vi
      .spyOn(axios, "post")
      .mockResolvedValueOnce({ data: { id: "container_1" } })
      .mockResolvedValueOnce({ data: { id: "thread_1" } });
    vi.spyOn(axios, "get")
      .mockResolvedValueOnce({ data: { status: "FINISHED" } })
      .mockResolvedValueOnce({
        data: { permalink: "https://www.threads.net/@threads-user/post/1" },
      });

    const result = await Effect.runPromise(
      threadsPublisher
        .publish({
          socialProviderId: "connection_threads",
          content: content([{ text: "Hello Threads", media: [] }]),
        })
        .pipe(Effect.provide(Store))
    );

    expect(result).toMatchObject({
      platformPostId: "thread_1",
      platformPostUrl: "https://www.threads.net/@threads-user/post/1",
    });
    const createUrl = new URL(String(post.mock.calls[0]?.[0]));
    expect(createUrl.searchParams.get("media_type")).toBe("TEXT");
    expect(createUrl.searchParams.get("text")).toBe("Hello Threads");
  });

  it("creates child containers before publishing an image carousel", async () => {
    const post = vi
      .spyOn(axios, "post")
      .mockResolvedValueOnce({ data: { id: "child_1" } })
      .mockResolvedValueOnce({ data: { id: "child_2" } })
      .mockResolvedValueOnce({ data: { id: "carousel_1" } })
      .mockResolvedValueOnce({ data: { id: "thread_carousel" } });
    vi.spyOn(axios, "get")
      .mockResolvedValueOnce({ data: { status: "FINISHED" } })
      .mockResolvedValueOnce({
        data: {
          permalink: "https://www.threads.net/@threads-user/post/carousel",
        },
      });

    await Effect.runPromise(
      threadsPublisher
        .publish({
          socialProviderId: "connection_threads",
          content: content([
            {
              text: "Carousel",
              media: [
                { mediaType: "IMAGE", url: "https://media.test/one.jpg" },
                { mediaType: "IMAGE", url: "https://media.test/two.jpg" },
              ],
            },
          ]),
        })
        .pipe(Effect.provide(Store))
    );

    const childUrls = post.mock.calls
      .slice(0, 2)
      .map((call) => new URL(String(call[0])));
    expect(
      childUrls.every(
        (url) => url.searchParams.get("is_carousel_item") === "true"
      )
    ).toBe(true);
    const carouselUrl = new URL(String(post.mock.calls[2]?.[0]));
    expect(carouselUrl.searchParams.get("media_type")).toBe("CAROUSEL");
    expect(carouselUrl.searchParams.get("children")).toBe("child_1,child_2");
  });

  it("publishes ordered segments as replies to the previous post", async () => {
    const post = vi
      .spyOn(axios, "post")
      .mockResolvedValueOnce({ data: { id: "container_1" } })
      .mockResolvedValueOnce({ data: { id: "thread_1" } })
      .mockResolvedValueOnce({ data: { id: "container_2" } })
      .mockResolvedValueOnce({ data: { id: "thread_2" } });
    vi.spyOn(axios, "get")
      .mockResolvedValueOnce({ data: { status: "FINISHED" } })
      .mockResolvedValueOnce({ data: { status: "FINISHED" } })
      .mockResolvedValueOnce({
        data: { permalink: "https://www.threads.net/@threads-user/post/1" },
      });

    const result = await Effect.runPromise(
      threadsPublisher
        .publish({
          socialProviderId: "connection_threads",
          content: content([
            { text: "First", media: [] },
            { text: "Second", media: [] },
          ]),
        })
        .pipe(Effect.provide(Store))
    );

    const replyUrl = new URL(String(post.mock.calls[2]?.[0]));
    expect(replyUrl.searchParams.get("reply_to_id")).toBe("thread_1");
    expect(result.platformPostId).toBe("thread_1");
  });

  it("rejects unsupported mixed image and video content", () => {
    expect(
      threadsRules.validate({
        text: "Mixed media",
        media: [
          { mediaType: "IMAGE", url: "https://media.test/one.jpg" },
          { mediaType: "VIDEO", url: "https://media.test/video.mp4" },
        ],
      })
    ).toEqual({
      valid: false,
      errors: ["Threads does not support mixing videos and images"],
    });
  });
});
