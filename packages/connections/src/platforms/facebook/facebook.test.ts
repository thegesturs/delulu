import axios from "axios";
import { Effect, Layer } from "effect";
import { afterEach, expect, it, vi } from "vitest";
import { ConnectionStore } from "../../services/connection-store";
import { facebookPublisher } from "./publish";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("bounds reel transfer and releases its source when upload fails", async () => {
  vi.spyOn(axios, "post").mockResolvedValue({
    data: {
      video_id: "video",
      upload_url: "https://upload.test/video",
    },
  });
  const timeout = vi.spyOn(AbortSignal, "timeout");
  const cancel = vi.fn();
  const source = new ReadableStream({ cancel });
  const requests: RequestInit[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url, init: RequestInit) => {
      requests.push(init);
      if (requests.length === 1) {
        return new Response(source, { headers: { "content-length": "5" } });
      }
      throw new Error("upload aborted");
    })
  );
  const store = Layer.succeed(
    ConnectionStore,
    ConnectionStore.of({
      getSocialProviderWithDecryptedTokens: () =>
        Effect.succeed({
          _id: "facebook",
          socialType: "FACEBOOK",
          accessToken: "token",
          profileId: "page",
        }),
      updateSocialProvider: () => Effect.void,
    })
  );
  await expect(
    Effect.runPromise(
      facebookPublisher
        .publish({
          socialProviderId: "facebook",
          content: {
            postId: "post",
            socialProviderId: "facebook",
            content: [
              {
                order: 0,
                name: "Reel",
                text: "Caption",
                tags: [],
                media: [
                  { mediaType: "VIDEO", url: "https://media.test/video.mp4" },
                ],
              },
            ],
          },
        })
        .pipe(Effect.provide(store))
    )
  ).rejects.toBeDefined();
  expect(timeout).toHaveBeenCalledWith(300_000);
  expect(requests).toHaveLength(2);
  expect(requests[0].signal).toBeInstanceOf(AbortSignal);
  expect(requests[1].signal).toBe(requests[0].signal);
  expect(cancel).toHaveBeenCalledTimes(1);
});
