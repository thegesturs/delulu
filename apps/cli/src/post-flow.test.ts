import { describe, expect, it, vi } from "vitest";
import {
  type PostFlowAdapter,
  type PostFlowResult,
  submitPost,
} from "./post-flow.js";

const post = (status: string): PostFlowResult => ({
  id: "post_atomic123456",
  status,
  targets: [{ id: "post_target_atomic", status: "pending" }],
});

const adapterFor = (
  overrides: Partial<PostFlowAdapter> = {}
): PostFlowAdapter => ({
  listAccounts: async () => [
    {
      id: "connection_linkedin1",
      platform: "LINKEDIN",
      username: "swaraj",
    },
  ],
  addMedia: async () => "media_uploaded123",
  create: async () => post("publishing"),
  get: async () => post("published"),
  sleep: async () => undefined,
  now: () => 0,
  ...overrides,
});

describe("submitPost", () => {
  it("uploads media and publishes with one atomic create call", async () => {
    const create = vi.fn(async () => post("publishing"));
    const get = vi.fn(async () => post("published"));
    const addMedia = vi.fn(async () => "media_uploaded123");
    const result = await submitPost(
      {
        caption: "Publish once",
        accountSelectors: ["linkedin"],
        mediaSources: ["video.mp4"],
        intent: "publish_now",
        idempotencyKey: "agent-run-123",
      },
      adapterFor({ create, get, addMedia })
    );

    expect(result.status).toBe("published");
    expect(create).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: "publish_now",
        idempotencyKey: "agent-run-123",
        mediaIds: ["media_uploaded123"],
      })
    );
    expect(get).toHaveBeenCalledOnce();
  });

  it("never retries a publish response that incorrectly remains draft", async () => {
    const create = vi.fn(async () => post("draft"));
    const get = vi.fn(async () => post("published"));

    await expect(
      submitPost(
        {
          caption: "Do not duplicate",
          accountSelectors: ["linkedin"],
          intent: "publish_now",
        },
        adapterFor({ create, get })
      )
    ).rejects.toThrow("remains a draft and was not retried");
    expect(create).toHaveBeenCalledOnce();
    expect(get).not.toHaveBeenCalled();
  });

  it("requires a specific selector when a platform has multiple accounts", async () => {
    const adapter = adapterFor({
      listAccounts: async () => [
        { id: "connection_one", platform: "LINKEDIN", username: "one" },
        { id: "connection_two", platform: "LINKEDIN", username: "two" },
      ],
    });

    await expect(
      submitPost(
        {
          caption: "Choose explicitly",
          accountSelectors: ["linkedin"],
          intent: "draft",
        },
        adapter
      )
    ).rejects.toThrow("linkedin@one, linkedin@two");
  });

  it("requires an explicit target even when only one account exists", async () => {
    await expect(
      submitPost(
        {
          caption: "Choose explicitly",
          intent: "draft",
        },
        adapterFor()
      )
    ).rejects.toMatchObject({ code: "ACCOUNT_REQUIRED", exitCode: 2 });
  });
});
