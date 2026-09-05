import { Effect, Layer } from "effect";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConnectionStore } from "../../services/connection-store";
import type { PublishContext } from "../../types";
import { youtubePublisher } from "./publish";

const Store = Layer.succeed(
  ConnectionStore,
  ConnectionStore.of({
    getSocialProviderWithDecryptedTokens: () =>
      Effect.succeed({
        _id: "youtube",
        socialType: "YOUTUBE",
        refreshToken: "refresh",
        accessToken: "access",
        profileId: "channel",
      }),
    updateSocialProvider: () => Effect.void,
  })
);
const context = (state: Record<string, unknown> = {}): PublishContext => ({
  socialProviderId: "youtube",
  providerState: state,
  persistProviderState: vi.fn(async () => undefined),
  content: {
    postId: "post",
    socialProviderId: "youtube",
    content: [
      {
        order: 0,
        name: "Video",
        title: "Title",
        text: "Caption",
        tags: [],
        media: [{ mediaType: "VIDEO", url: "https://media.test/video.mp4" }],
      },
    ],
  },
});
const run = (ctx: PublishContext) =>
  Effect.runPromise(youtubePublisher.publish(ctx).pipe(Effect.provide(Store)));
afterEach(() => vi.unstubAllGlobals());
describe("durable YouTube upload", () => {
  it("classifies rejected authorization as permanent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("denied", { status: 403 }))
    );
    await expect(run(context())).rejects.toMatchObject({
      retryable: false,
      code: "API_ERROR",
    });
  });
  it("probes a persisted session and uploads only missing bytes", async () => {
    const ctx = context({
      youtubeUploadUrl: "https://www.googleapis.com/upload/session",
    });
    const requests: RequestInit[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, init: RequestInit) => {
        if (String(url).includes("oauth2")) {
          return Response.json({ access_token: "access" });
        }
        if (String(url).includes("media.test")) {
          const range = new Headers(init.headers).get("range");
          return range === "bytes=0-0"
            ? new Response("v", {
                status: 206,
                headers: { "content-range": "bytes 0-0/5" },
              })
            : new Response("deo", {
                status: 206,
                headers: { "content-range": "bytes 2-4/5" },
              });
        }
        requests.push(init);
        return requests.length === 1
          ? new Response(null, { status: 308, headers: { range: "bytes=0-1" } })
          : Response.json({ id: "confirmed" });
      })
    );
    const result = await run(ctx);
    expect(result.platformPostId).toBe("confirmed");
    expect(new Headers(requests[1].headers).get("content-range")).toBe(
      "bytes 2-4/5"
    );
    expect(ctx.persistProviderState).toHaveBeenCalledWith(
      expect.objectContaining({ youtubeVideoId: "confirmed" })
    );
  });
  it("recovers a lost final response without starting another upload", async () => {
    const ctx = context({
      youtubeUploadUrl: "https://www.googleapis.com/upload/session",
    });
    const fetcher = vi.fn(async (url) =>
      String(url).includes("oauth2")
        ? Response.json({ access_token: "access" })
        : String(url).includes("media.test")
          ? new Response("v", {
              status: 206,
              headers: { "content-range": "bytes 0-0/5" },
            })
          : Response.json({ id: "already-published" })
    );
    vi.stubGlobal("fetch", fetcher);
    expect((await run(ctx)).platformPostId).toBe("already-published");
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it("preserves a published video when an optional thumbnail is rejected", async () => {
    const ctx = context({ youtubeVideoId: "published" });
    ctx.content.content[0].media[0].thumbnailBucketUrl =
      "https://media.test/thumb.jpg";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) =>
        String(url).includes("oauth2")
          ? Response.json({ access_token: "access" })
          : new Response("denied", { status: 403 })
      )
    );
    expect((await run(ctx)).platformPostId).toBe("published");
    expect(ctx.persistProviderState).toHaveBeenCalledWith(
      expect.objectContaining({ youtubeThumbnailError: expect.any(String) })
    );
  });
});
