import { Effect } from "effect";
import { afterEach, describe, expect, it, vi } from "vitest";
import { instagramQueries } from "./queries";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Instagram automation media queries", () => {
  it("returns a cursor page with thumbnails without requesting insights", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              id: "media-2",
              caption: "Latest",
              media_type: "VIDEO",
              timestamp: "2026-07-25T12:00:00Z",
              permalink: "https://instagram.test/p/media-2",
              thumbnail_url: "https://cdn.test/thumb.jpg",
              media_url: "https://cdn.test/video.mp4",
            },
          ],
          paging: { cursors: { after: "cursor-2" } },
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const page = await Effect.runPromise(
      instagramQueries.getPosts!({
        profileId: "profile-1",
        accessToken: "secret",
        limit: 20,
        after: "cursor-1",
      })
    );

    expect(page).toEqual({
      data: [
        {
          id: "media-2",
          caption: "Latest",
          mediaType: "VIDEO",
          timestamp: "2026-07-25T12:00:00Z",
          permalink: "https://instagram.test/p/media-2",
          thumbnailUrl: "https://cdn.test/thumb.jpg",
          mediaUrl: "https://cdn.test/video.mp4",
        },
      ],
      nextCursor: "cursor-2",
    });
    const requested = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requested.searchParams.get("after")).toBe("cursor-1");
    expect(requested.pathname).toContain("/profile-1/media");
    expect(requested.pathname).not.toContain("insights");
  });

  it.each([
    [429, "RateLimitedError"],
    [401, "ProviderApiError"],
  ])("classifies provider HTTP %s responses", async (status, tag) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("provider error", { status }))
    );
    await expect(
      Effect.runPromise(
        instagramQueries.getPosts!({
          profileId: "profile-1",
          accessToken: "expired",
          limit: 25,
        })
      )
    ).rejects.toMatchObject({ _tag: tag });
  });

  it("rejects malformed success responses as retryable provider errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ data: [{ caption: "missing fields" }] }),
          {
            status: 200,
          }
        )
      )
    );
    await expect(
      Effect.runPromise(
        instagramQueries.getStories!({
          profileId: "profile-1",
          accessToken: "secret",
          limit: 25,
        })
      )
    ).rejects.toMatchObject({
      _tag: "ProviderApiError",
      retryable: true,
    });
  });
});
