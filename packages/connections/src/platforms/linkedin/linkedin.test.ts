import axios from "axios";
import { Effect, Layer } from "effect";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConnectionStore } from "../../services/connection-store";
import { linkedinAuth } from "./auth";
import { LINKEDIN_VERSION } from "./constants";
import { linkedinPublisher } from "./publish";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("LinkedIn current API contract", () => {
  it("uses the current version and least-required member scopes", async () => {
    vi.stubEnv("LINKEDIN_CLIENT_ID", "client");
    vi.stubEnv("LINKEDIN_CALLBACK_URL", "https://app.test/callback");

    const url = new URL(
      await linkedinAuth.getConnectUrl({ state: "signed-state" })
    );

    expect(LINKEDIN_VERSION).toBe("202607");
    expect(url.searchParams.get("scope")?.split(" ")).toEqual([
      "openid",
      "profile",
      "w_member_social",
    ]);
    expect(url.searchParams.get("state")).toBe("signed-state");
  });

  it("persists OIDC userinfo and partner refresh tokens when returned", async () => {
    vi.stubEnv("LINKEDIN_CLIENT_ID", "client");
    vi.stubEnv("LINKEDIN_CLIENT_SECRET", "secret");
    vi.stubEnv("LINKEDIN_CALLBACK_URL", "https://app.test/callback");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              access_token: "access",
              expires_in: 3600,
              refresh_token: "refresh",
              refresh_token_expires_in: 7200,
            }),
            { status: 200 }
          )
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              sub: "member_1",
              name: "Test Member",
              picture: "https://media.example.test/profile.jpg",
            }),
            { status: 200 }
          )
        )
    );
    const upsert = vi.fn().mockResolvedValue({ status: "created" });

    await linkedinAuth.handleCallback({
      code: "authorization-code",
      error: null,
      errorReason: null,
      state: "signed-state",
      userId: "user_1",
      upsert,
      temporaryStore: {
        get: vi.fn().mockResolvedValue(null),
        put: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      },
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        socialType: "LINKEDIN",
        profileId: "member_1",
        fullName: "Test Member",
        profileImage: "https://media.example.test/profile.jpg",
        accessToken: "access",
        refreshToken: "refresh",
        refreshTokenExpiresIn: expect.any(Number),
      })
    );
    expect(vi.mocked(fetch).mock.calls[1]?.[0]).toBe(
      "https://api.linkedin.com/v2/userinfo"
    );
  });

  it("refreshes and persists an expiring partner token before publishing", async () => {
    vi.stubEnv("LINKEDIN_CLIENT_ID", "client");
    vi.stubEnv("LINKEDIN_CLIENT_SECRET", "secret");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            access_token: "fresh-access",
            expires_in: 3600,
            refresh_token: "fresh-refresh",
            refresh_token_expires_in: 7200,
          }),
          { status: 200 }
        )
      )
    );
    const update = vi.fn(() => Effect.void);
    const Store = Layer.succeed(ConnectionStore, {
      getSocialProviderWithDecryptedTokens: () =>
        Effect.succeed({
          _id: "connection_linkedin",
          socialType: "LINKEDIN" as const,
          accessToken: "stale-access",
          refreshToken: "current-refresh",
          expiresIn: Date.now() + 30_000,
          profileId: "member_1",
          username: "test-member",
        }),
      updateSocialProvider: update,
    });
    const post = vi.spyOn(axios, "post").mockResolvedValue({
      headers: { "x-restli-id": "urn:li:share:1" },
      data: {},
    });

    const result = await Effect.runPromise(
      linkedinPublisher
        .publish({
          socialProviderId: "connection_linkedin",
          content: {
            postId: "post_1",
            socialProviderId: "connection_linkedin",
            content: [
              {
                order: 0,
                name: "Post",
                text: "Hello LinkedIn",
                tags: [],
                media: [],
              },
            ],
          },
        })
        .pipe(Effect.provide(Store))
    );

    expect(result.platformPostId).toBe("urn:li:share:1");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        socialProviderId: "connection_linkedin",
        accessToken: "fresh-access",
        refreshToken: "fresh-refresh",
      })
    );
    expect(
      (post.mock.calls[0]?.[2]?.headers as Record<string, string> | undefined)
        ?.Authorization
    ).toBe("Bearer fresh-access");
  });

  it("waits for a document to become available before creating the post", async () => {
    const Store = Layer.succeed(ConnectionStore, {
      getSocialProviderWithDecryptedTokens: () =>
        Effect.succeed({
          _id: "connection_linkedin",
          socialType: "LINKEDIN" as const,
          accessToken: "current-access",
          expiresIn: Date.now() + 12 * 60 * 60 * 1000,
          profileId: "member_1",
          username: "test-member",
        }),
      updateSocialProvider: () => Effect.void,
    });
    const get = vi
      .spyOn(axios, "get")
      .mockResolvedValueOnce({ data: Buffer.from("document") })
      .mockResolvedValueOnce({ data: { status: "AVAILABLE" } });
    vi.spyOn(axios, "put").mockResolvedValue({ status: 201 });
    const post = vi
      .spyOn(axios, "post")
      .mockResolvedValueOnce({
        data: {
          value: {
            uploadUrl: "https://uploads.linkedin.test/document",
            document: "urn:li:document:doc_1",
          },
        },
      })
      .mockResolvedValueOnce({
        headers: { "x-restli-id": "urn:li:share:document_post" },
        data: {},
      });

    await Effect.runPromise(
      linkedinPublisher
        .publish({
          socialProviderId: "connection_linkedin",
          content: {
            postId: "post_document",
            socialProviderId: "connection_linkedin",
            content: [
              {
                order: 0,
                name: "Document",
                text: "Document post",
                tags: [],
                media: [
                  {
                    mediaType: "DOCUMENT",
                    url: "https://media.example.test/deck.pptx",
                    altText: "Quarterly deck",
                  },
                ],
              },
            ],
          },
        })
        .pipe(Effect.provide(Store))
    );

    expect(get.mock.calls[1]?.[0]).toBe(
      "https://api.linkedin.com/rest/documents/urn%3Ali%3Adocument%3Adoc_1"
    );
    expect(post.mock.calls[1]?.[0]).toBe("https://api.linkedin.com/rest/posts");
  });

  it("publishes an image using the current Posts API media shape", async () => {
    const Store = Layer.succeed(ConnectionStore, {
      getSocialProviderWithDecryptedTokens: () =>
        Effect.succeed({
          _id: "connection_linkedin",
          socialType: "LINKEDIN" as const,
          accessToken: "current-access",
          profileId: "member_1",
          username: "test-member",
        }),
      updateSocialProvider: () => Effect.void,
    });
    vi.spyOn(axios, "get").mockResolvedValue({ data: Buffer.from("image") });
    vi.spyOn(axios, "put").mockResolvedValue({ status: 201 });
    const post = vi
      .spyOn(axios, "post")
      .mockResolvedValueOnce({
        data: {
          value: {
            uploadUrl: "https://uploads.linkedin.test/image",
            image: "urn:li:image:image_1",
          },
        },
      })
      .mockResolvedValueOnce({
        headers: { "x-restli-id": "urn:li:share:image_post" },
        data: {},
      });

    await Effect.runPromise(
      linkedinPublisher
        .publish({
          socialProviderId: "connection_linkedin",
          content: {
            postId: "post_image",
            socialProviderId: "connection_linkedin",
            content: [
              {
                order: 0,
                name: "Image",
                text: "Image post",
                tags: [],
                media: [
                  {
                    mediaType: "IMAGE",
                    url: "https://media.example.test/image.jpg",
                    altText: "Product image",
                  },
                ],
              },
            ],
          },
        })
        .pipe(Effect.provide(Store))
    );

    expect(post.mock.calls[1]?.[1]).toMatchObject({
      content: {
        media: { id: "urn:li:image:image_1" },
      },
    });
  });

  it("rejects a create response that has no durable post ID", async () => {
    const Store = Layer.succeed(ConnectionStore, {
      getSocialProviderWithDecryptedTokens: () =>
        Effect.succeed({
          _id: "connection_linkedin",
          socialType: "LINKEDIN" as const,
          accessToken: "current-access",
          profileId: "member_1",
          username: "test-member",
        }),
      updateSocialProvider: () => Effect.void,
    });
    vi.spyOn(axios, "post").mockResolvedValue({ headers: {}, data: {} });

    await expect(
      Effect.runPromise(
        linkedinPublisher
          .publish({
            socialProviderId: "connection_linkedin",
            content: {
              postId: "post_missing_id",
              socialProviderId: "connection_linkedin",
              content: [
                {
                  order: 0,
                  name: "Post",
                  text: "No ID",
                  tags: [],
                  media: [],
                },
              ],
            },
          })
          .pipe(Effect.provide(Store))
      )
    ).rejects.toMatchObject({ code: "PUBLISH_REJECTED" });
  });
});
